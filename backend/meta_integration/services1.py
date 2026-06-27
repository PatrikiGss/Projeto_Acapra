
import logging
import re
import requests
import time
import os
from django.conf import settings

logger = logging.getLogger(__name__)

GRAPH_API_VERSION = 'v23.0'
GRAPH_API_BASE = f'https://graph.facebook.com/{GRAPH_API_VERSION}'

_LOCAL_URL = re.compile(
    r'^https?://(localhost|127\.\d+\.\d+\.\d+|\[::1\]|0\.0\.0\.0)(:\d+)?',
    re.IGNORECASE,
)


# -----------------------------
# MESSAGE BUILDER
# -----------------------------
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


# -----------------------------
# IMAGE HELPERS
# -----------------------------
def get_photo_absolute_url(animal):
    if not animal.foto:
        return None

    site_url = getattr(settings, 'SITE_URL', '').rstrip('/')

    if not site_url or _LOCAL_URL.match(site_url):
        return None

    return f"{site_url}{settings.MEDIA_URL}{animal.foto}"


def _local_file_path(animal):
    if not animal.foto:
        return None

    path = os.path.join(settings.MEDIA_ROOT, str(animal.foto))
    return path if os.path.exists(path) else None


def _mime_type(file_path):
    ext = file_path.rsplit('.', 1)[-1].lower()
    return {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif'
    }.get(ext, 'image/jpeg')


def wait_image_ready(url, retries=3, delay=2):
    for i in range(retries):
        try:
            r = requests.get(url, timeout=10)
            content_type = r.headers.get("Content-Type", "")

            if r.status_code == 200 and "image" in content_type:
                return True

            logger.warning(
                "Imagem ainda não pronta (%s/%s): %s status=%s type=%s",
                i + 1,
                retries,
                url,
                r.status_code,
                content_type,
            )

        except Exception as e:
            logger.warning("Erro ao validar imagem: %s", e)

        time.sleep(delay)

    return False


# -----------------------------
# FACEBOOK POST
# -----------------------------
def post_to_facebook(connection, animal):
    message = build_post_message(animal)
    local_file = _local_file_path(animal)

    if local_file:
        filename = os.path.basename(local_file)
        mime = _mime_type(local_file)

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


# -----------------------------
# INSTAGRAM POST (ROBUSTO)
# -----------------------------
def post_to_instagram(connection, animal):
    if not connection.instagram_id:
        logger.warning("Instagram não configurado para %s", connection.page_name)
        return None

    photo_url = get_photo_absolute_url(animal)

    if not photo_url:
        logger.warning("Sem URL válida para Instagram: %s", animal.nome_animal)
        return None

    logger.info("Instagram START %s | URL: %s", animal.nome_animal, photo_url)

    # garante que imagem está acessível
    if not wait_image_ready(photo_url):
        logger.error("Imagem não está pronta para Instagram: %s", photo_url)
        return None

    caption = build_post_message(animal)

    last_error = None

    for attempt in range(3):
        try:
            logger.info("Instagram attempt %s - %s", attempt + 1, animal.nome_animal)

            container_resp = requests.post(
                f"{GRAPH_API_BASE}/{connection.instagram_id}/media",
                data={
                    'image_url': photo_url,
                    'caption': caption,
                    'access_token': connection.page_access_token,
                },
                timeout=20,
            )

            logger.info("Container: %s %s", container_resp.status_code, container_resp.text)
            container_resp.raise_for_status()

            creation_id = container_resp.json()['id']

            time.sleep(2)

            publish_resp = requests.post(
                f"{GRAPH_API_BASE}/{connection.instagram_id}/media_publish",
                data={
                    'creation_id': creation_id,
                    'access_token': connection.page_access_token,
                },
                timeout=20,
            )

            logger.info("Publish: %s %s", publish_resp.status_code, publish_resp.text)
            publish_resp.raise_for_status()

            logger.info("Instagram SUCCESS %s", animal.nome_animal)
            return publish_resp.json()

        except Exception as e:
            last_error = e
            logger.warning("Instagram attempt %s falhou: %s", attempt + 1, str(e))
            time.sleep(3)

    logger.error("Instagram FAILED final: %s", last_error)
    return None


# -----------------------------
# AUTO POST
# -----------------------------
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
            logger.error("Falha Facebook (%s): %s %s", animal.nome_animal, exc, detail)

        try:
            post_to_instagram(connection, animal)
            logger.info("Publicado no Instagram: %s", animal.nome_animal)
        except Exception as exc:
            detail = getattr(getattr(exc, 'response', None), 'text', '')
            logger.error("Falha Instagram (%s): %s %s", animal.nome_animal, exc, detail)