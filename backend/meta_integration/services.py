import logging
import re
import requests
from django.conf import settings

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
        f"Contato do dono: {animal.telefone}"
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

    return f"{site_url}/media/{animal.foto}"


def _local_file_path(animal):
    import os
    if not animal.foto:
        return None
    path = os.path.join(settings.MEDIA_ROOT, str(animal.foto))
    return path if os.path.exists(path) else None


def _mime_type(file_path):
    ext = file_path.rsplit('.', 1)[-1].lower()
    return {'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png', 'gif': 'image/gif'}.get(ext, 'image/jpeg')


def post_to_facebook(connection, animal):
    message = build_post_message(animal)
    local_file = _local_file_path(animal)

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
    elif animal.foto:
        # Fallback: URL pública (produção com armazenamento externo)
        photo_url = get_photo_absolute_url(animal)
        if photo_url:
            response = requests.post(
                f"{GRAPH_API_BASE}/{connection.page_id}/photos",
                data={
                    'url': photo_url,
                    'message': message,
                    'access_token': connection.page_access_token,
                },
                timeout=30,
            )
        else:
            response = requests.post(
                f"{GRAPH_API_BASE}/{connection.page_id}/feed",
                data={
                    'message': message,
                    'access_token': connection.page_access_token,
                },
                timeout=15,
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

    photo_url = get_photo_absolute_url(animal)
    if not photo_url:
        logger.warning(
            "Pulando Instagram (%s): SITE_URL não configurado ou é local. "
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
