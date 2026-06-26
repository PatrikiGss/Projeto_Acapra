import logging
import os
import re
from pathlib import Path

import requests
from django.conf import settings
from PIL import Image, ImageOps

logger = logging.getLogger(__name__)

GRAPH_API_VERSION = 'v23.0'
GRAPH_API_BASE = f'https://graph.facebook.com/{GRAPH_API_VERSION}'

_LOCAL_URL = re.compile(
    r'^https?://(localhost|127\.\d+\.\d+\.\d+|\[::1\]|0\.0\.0\.0)(:\d+)?',
    re.IGNORECASE,
)

def build_post_message(animal):
    especie_map = {'cachorro': 'Cachorro', 'gato': 'Gato', 'outros': 'Animal'}
    sexo_map = {'macho': 'Macho', 'femea': 'Fêmea'}

    especie = especie_map.get(animal.especie, 'Animal')
    sexo = sexo_map.get(animal.sexo, '')

    lines = [
        f"{animal.nome_animal} está disponível para adoção!",
        "",
        f"{especie}",
        f"{sexo}",
        f"Contato: {animal.telefone}"
    ]
    if animal.descricao:
        lines += ["", animal.descricao]

    lines += ["", "Entre em contato para saber mais sobre a adoção!"]
    return "\n".join(lines)


def get_photo_absolute_url(animal):
    if not animal.foto:
        return None

    site_url = getattr(settings, 'SITE_URL', '').rstrip('/')
    if not site_url or _LOCAL_URL.match(site_url):
        return None

    return f"{site_url}{settings.MEDIA_URL}{animal.foto}"


def _local_photo_path(animal):
    if not animal.foto:
        return None

    path = os.path.join(settings.MEDIA_ROOT, str(animal.foto))
    return path if os.path.exists(path) else None


def _framed_photo_path(animal):
    source_path = _local_photo_path(animal)
    if not source_path:
        return None

    source = Path(source_path)
    framed_dir = Path(settings.MEDIA_ROOT) / "social_frames"
    framed_dir.mkdir(parents=True, exist_ok=True)
    framed_path = framed_dir / f"animal_{animal.pk}_{source.stem}.jpg"

    logo_candidates = [
        Path(settings.BASE_DIR) / "media" / "social_assets" / "acapra-logo-com-texto.png",
        Path(settings.BASE_DIR) / "media" / "social_assets" / "Acapra_logo - Sfundo.png",
    ]
    logo_path = next((candidate for candidate in logo_candidates if candidate.exists()), None)

    if framed_path.exists():
        framed_mtime = framed_path.stat().st_mtime
        source_mtime = source.stat().st_mtime
        logo_mtime = logo_path.stat().st_mtime if logo_path else 0
        if framed_mtime >= source_mtime and framed_mtime >= logo_mtime:
            return str(framed_path)

    with Image.open(source) as image:
        image = ImageOps.exif_transpose(image).convert("RGB")
        canvas = image.copy()

        if not logo_path:
            logger.warning(
                "Logo para moldura não encontrada. Caminhos verificados: %s",
                ", ".join(str(candidate) for candidate in logo_candidates),
            )

        if logo_path:
            with Image.open(logo_path) as logo:
                logo = ImageOps.exif_transpose(logo)
                if logo.mode != "RGBA":
                    logo = logo.convert("RGBA")

                max_logo_width = max(220, canvas.width // 3)
                max_logo_height = max(120, canvas.height // 5)
                logo.thumbnail((max_logo_width, max_logo_height), Image.Resampling.LANCZOS)

                logo_x = canvas.width - logo.width - 32
                logo_y = canvas.height - logo.height - 32

                canvas.paste(logo, (logo_x, logo_y), logo)

        canvas.save(framed_path, format="JPEG", quality=92, optimize=True)

    return str(framed_path)


def get_framed_photo_absolute_url(animal):
    framed_path = _framed_photo_path(animal)
    if not framed_path:
        return None

    site_url = getattr(settings, 'SITE_URL', '').rstrip('/')
    if not site_url or _LOCAL_URL.match(site_url):
        return None

    relative_path = Path(framed_path).relative_to(settings.MEDIA_ROOT).as_posix()
    return f"{site_url}{settings.MEDIA_URL}{relative_path}"


def _mime_type(file_path):
    ext = file_path.rsplit('.', 1)[-1].lower()
    return {'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png', 'gif': 'image/gif'}.get(ext, 'image/jpeg')


def post_to_facebook(connection, animal):
    message = build_post_message(animal)
    local_file = _framed_photo_path(animal)

    if local_file:
        import os
        filename = os.path.basename(local_file)
        mime = _mime_type(local_file)
        # Upload binário direto com MIME type explícito
        with open(local_file, 'rb') as f:
            response = requests.post(
                f"{GRAPH_API_BASE}/{connection.page_id}/photos",
                data={
                    'message': message,
                    'access_token': connection.page_access_token,
                },
                files={'source': (filename, f, mime)},
                timeout=60,
            )
    else:
        # Sem foto: post somente texto
        response = requests.post(
            f"{GRAPH_API_BASE}/{connection.page_id}/feed",
            data={
                'message': message,
                'access_token': connection.page_access_token,
            },
            timeout=15,
        )

    response.raise_for_status()
    return response.json()


def post_to_instagram(connection, animal):
    if not connection.instagram_id:
        logger.warning(
            "Instagram não configurado na conexão da página '%s'. "
            "Vincule uma conta Instagram Business à página no Meta Business Suite.",
            connection.page_name,
        )
        return None

    photo_url = get_framed_photo_absolute_url(animal)
    if not photo_url:
        logger.warning(
            "Pulando Instagram (%s): não foi possível gerar uma URL pública da versão moldurada. "
            "Defina SITE_URL com URL pública no .env.",
            animal.nome_animal,
        )
        return None

    logger.info("Tentando publicar no Instagram (%s): %s", animal.nome_animal, photo_url)

    caption = build_post_message(animal)

    # Step 1: Create media container
    container_resp = requests.post(
        f"{GRAPH_API_BASE}/{connection.instagram_id}/media",
        data={
            'image_url': photo_url,
            'caption': caption,
            'access_token': connection.page_access_token,
        },
        timeout=15,
    )
    container_resp.raise_for_status()
    creation_id = container_resp.json()['id']

    # Step 2: Publish container
    publish_resp = requests.post(
        f"{GRAPH_API_BASE}/{connection.instagram_id}/media_publish",
        data={
            'creation_id': creation_id,
            'access_token': connection.page_access_token,
        },
        timeout=15,
    )
    publish_resp.raise_for_status()
    return publish_resp.json()


def auto_post_animal(animal):
    from .models import MetaConnection

    connections = MetaConnection.objects.filter(is_active=True)
    if not connections.exists():
        return

    for connection in connections:
        try:
            post_to_facebook(connection, animal)
            logger.info("Publicado no Facebook: %s", animal.nome_animal)
        except Exception as exc:
            detail = getattr(getattr(exc, 'response', None), 'text', '')
            logger.error("Falha ao publicar no Facebook (%s): %s %s", animal.nome_animal, exc, detail)

        try:
            post_to_instagram(connection, animal)
            logger.info("Publicado no Instagram: %s", animal.nome_animal)
        except Exception as exc:
            detail = getattr(getattr(exc, 'response', None), 'text', '')
            logger.error("Falha ao publicar no Instagram (%s): %s %s", animal.nome_animal, exc, detail)
