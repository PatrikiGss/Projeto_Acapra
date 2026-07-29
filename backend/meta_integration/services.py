import logging
import os
import re
import time
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

# Log de publicações fica ENXUTO: só falhas/pulados são gravados, e ainda assim
# podamos para as últimas N linhas — mínimo impacto no SQLite do cliente.
LIMITE_LOGS_META = 200


# =========================================================
# MENSAGENS
# =========================================================

def build_post_message(animal):
    especie_map = {'cachorro': 'Cachorro', 'gato': 'Gato', 'outros': 'Animal'}
    sexo_map = {'macho': 'Macho', 'femea': 'Fêmea', 'ambos': 'Ambos'}

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


def build_post_message_publicacao(publicacao):
    linhas = [publicacao.titulo]
    resumo = getattr(publicacao, 'resumo', '') or ''
    if resumo.strip():
        linhas += ["", resumo.strip()]
    linhas += ["", "Acompanhe as novidades da ACAPRA no nosso site."]
    return "\n".join(linhas)


# =========================================================
# FOTO MOLDURADA (genérica: qualquer objeto com .foto e .pk)
# =========================================================

def get_photo_absolute_url(animal):
    if not animal.foto:
        return None

    site_url = getattr(settings, 'SITE_URL', '').rstrip('/')
    if not site_url or _LOCAL_URL.match(site_url):
        return None

    # No deploy a app roda sob o sub-URI /api, então a mídia pública fica em
    # /api/media/ (o Instagram baixa a imagem por essa URL).
    return f"{site_url}/api{settings.MEDIA_URL}{animal.foto}"


def _local_photo_path(obj):
    if not obj.foto:
        return None

    path = os.path.join(settings.MEDIA_ROOT, str(obj.foto))
    return path if os.path.exists(path) else None


def _framed_photo_path(obj, prefixo="item"):
    """Gera (e cacheia) uma versão da foto com a logo da ACAPRA no canto.

    `obj` só precisa ter `.foto` e `.pk`, então serve para Animal e Publicação.
    `prefixo` evita colisão de nomes entre tipos diferentes (ex.: animal_5 x pub_5).
    """
    source_path = _local_photo_path(obj)
    if not source_path:
        return None

    source = Path(source_path)
    framed_dir = Path(settings.MEDIA_ROOT) / "social_frames"
    framed_dir.mkdir(parents=True, exist_ok=True)
    framed_path = framed_dir / f"{prefixo}_{obj.pk}_{source.stem}.jpg"

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


def _framed_public_url(framed_path):
    """URL pública (com /api) da imagem moldurada, para o Instagram baixar."""
    if not framed_path:
        return None

    site_url = getattr(settings, 'SITE_URL', '').rstrip('/')
    if not site_url or _LOCAL_URL.match(site_url):
        return None

    relative_path = Path(framed_path).relative_to(settings.MEDIA_ROOT).as_posix()
    # Mídia pública sob /api/media/ (a app roda no sub-URI /api no deploy).
    return f"{site_url}/api{settings.MEDIA_URL}{relative_path}"


def get_framed_photo_absolute_url(animal):
    # Mantido por compatibilidade (usado no fluxo/testes de animais).
    return _framed_public_url(_framed_photo_path(animal, prefixo="animal"))


def _mime_type(file_path):
    ext = file_path.rsplit('.', 1)[-1].lower()
    return {'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png', 'gif': 'image/gif'}.get(ext, 'image/jpeg')


# =========================================================
# CHAMADAS DE BAIXO NÍVEL (Graph API)
# =========================================================

def _esperar_container_pronto(connection, creation_id, tentativas=15, intervalo=2):
    """
    O Instagram processa o container de mídia de forma ASSÍNCRONA. Publicar
    antes de o processamento terminar falha de forma intermitente. Aqui
    consultamos o status_code até virar FINISHED (ou erro/timeout).
    """
    for _ in range(tentativas):
        resp = requests.get(
            f"{GRAPH_API_BASE}/{creation_id}",
            params={"fields": "status_code", "access_token": connection.page_access_token},
            timeout=15,
        )
        resp.raise_for_status()
        status = resp.json().get("status_code")
        if status == "FINISHED":
            return
        if status in ("ERROR", "EXPIRED"):
            raise RuntimeError(f"Container do Instagram não pôde ser processado (status={status}).")
        time.sleep(intervalo)
    raise TimeoutError("Container do Instagram não ficou pronto (FINISHED) a tempo.")


def _fb_feed_photo(connection, message, local_file):
    """Publica uma foto (ou texto puro) no feed da Página do Facebook."""
    if local_file:
        with open(local_file, 'rb') as f:
            response = requests.post(
                f"{GRAPH_API_BASE}/{connection.page_id}/photos",
                data={'message': message, 'access_token': connection.page_access_token},
                files={'source': (os.path.basename(local_file), f, _mime_type(local_file))},
                timeout=60,
            )
    else:
        response = requests.post(
            f"{GRAPH_API_BASE}/{connection.page_id}/feed",
            data={'message': message, 'access_token': connection.page_access_token},
            timeout=15,
        )
    response.raise_for_status()
    return response.json()


def _fb_story(connection, local_file):
    """Publica a foto como STORY da Página (sobe como não publicada e cria o story).

    Requer que a Página tenha stories habilitados/permissão adequada — por isso
    é chamada de forma tolerante (falha aqui não impede feed/Instagram).
    """
    if not local_file:
        return None

    with open(local_file, 'rb') as f:
        upload = requests.post(
            f"{GRAPH_API_BASE}/{connection.page_id}/photos",
            data={'published': 'false', 'access_token': connection.page_access_token},
            files={'source': (os.path.basename(local_file), f, _mime_type(local_file))},
            timeout=60,
        )
    upload.raise_for_status()
    photo_id = upload.json()['id']

    response = requests.post(
        f"{GRAPH_API_BASE}/{connection.page_id}/photo_stories",
        data={'photo_id': photo_id, 'access_token': connection.page_access_token},
        timeout=30,
    )
    response.raise_for_status()
    return response.json()


def _ig_container(connection, image_url, caption=None, media_type=None):
    data = {'image_url': image_url, 'access_token': connection.page_access_token}
    if caption is not None:
        data['caption'] = caption
    if media_type:
        data['media_type'] = media_type
    resp = requests.post(f"{GRAPH_API_BASE}/{connection.instagram_id}/media", data=data, timeout=15)
    resp.raise_for_status()
    return resp.json()['id']


def _ig_publish(connection, creation_id):
    resp = requests.post(
        f"{GRAPH_API_BASE}/{connection.instagram_id}/media_publish",
        data={'creation_id': creation_id, 'access_token': connection.page_access_token},
        timeout=15,
    )
    resp.raise_for_status()
    return resp.json()


def _ig_feed(connection, image_url, caption):
    creation_id = _ig_container(connection, image_url, caption=caption)
    _esperar_container_pronto(connection, creation_id)
    return _ig_publish(connection, creation_id)


def _ig_story(connection, image_url):
    creation_id = _ig_container(connection, image_url, media_type="STORIES")
    _esperar_container_pronto(connection, creation_id)
    return _ig_publish(connection, creation_id)


# --- Wrappers de compatibilidade (fluxo/testes de animais) ---

def post_to_facebook(connection, animal):
    return _fb_feed_photo(connection, build_post_message(animal), _framed_photo_path(animal, prefixo="animal"))


def post_to_instagram(connection, animal):
    if not connection.instagram_id:
        return None
    photo_url = get_framed_photo_absolute_url(animal)
    if not photo_url:
        return None
    return _ig_feed(connection, photo_url, build_post_message(animal))


# =========================================================
# LOG DE FALHAS (só falhas/pulados; com poda automática)
# =========================================================

def _redact_token(texto):
    # Evita gravar tokens que possam aparecer em URLs de erro (ex.: params de GET).
    return re.sub(r'(access_token=)[^&\s"\']+', r'\1REDACTED', str(texto))


def _registrar_falha_meta(objeto_id, objeto_nome, rede, detalhe):
    """Grava SÓ falhas/pulados e poda a tabela; nunca derruba o fluxo."""
    from .models import MetaPostLog
    try:
        MetaPostLog.objects.create(
            animal_id=objeto_id,
            animal_nome=(objeto_nome or "")[:60],
            rede=rede,
            sucesso=False,
            detalhe=_redact_token(detalhe)[:4000],
        )
        # Poda: mantém apenas as últimas LIMITE_LOGS_META linhas.
        ids_manter = list(
            MetaPostLog.objects.order_by("-id").values_list("id", flat=True)[:LIMITE_LOGS_META]
        )
        if ids_manter:
            MetaPostLog.objects.exclude(id__in=ids_manter).delete()
    except Exception:
        logger.exception("Não foi possível gravar/podar o MetaPostLog (%s)", rede)


def _tentar(objeto_id, objeto_nome, rede, funcao, story=False):
    """Executa uma publicação isolando falhas: loga sucesso, registra falha."""
    rotulo = f"{rede}/{'story' if story else 'feed'}"
    try:
        funcao()
        logger.info("Publicado em %s: %s", rotulo, objeto_nome)
    except Exception as exc:
        detail = getattr(getattr(exc, 'response', None), 'text', '') or str(exc)
        marcador = "[STORY] " if story else ""
        _registrar_falha_meta(objeto_id, objeto_nome, rede, f"{marcador}{exc} | {detail}")
        logger.error("Falha ao publicar em %s (%s): %s %s", rotulo, objeto_nome, exc, detail)


# =========================================================
# ORQUESTRADORES
# =========================================================

def _flag(dados, nome, default=True):
    valor = dados.get(nome)
    if valor is None or valor == "":
        return default
    return str(valor).strip().lower() in ("true", "1", "on", "yes")


def flags_publicacao(dados):
    """Lê do payload o que publicar nas redes.

    Retorna (publicar, feed, story):
      - `publicar_redes` (default true) liga/desliga tudo;
      - `publicar_feed` e `publicar_story` (default true) escolhem os destinos.
    """
    publicar = _flag(dados, "publicar_redes", True)
    feed = _flag(dados, "publicar_feed", True)
    story = _flag(dados, "publicar_story", True)
    return publicar and (feed or story), feed, story

def _publicar(objeto, prefixo, nome_log, message, caption, feed=True, story=True):
    """Publica em todas as conexões ativas.

    `feed` e `story` permitem escolher os destinos: publicar só no feed, só no
    story, ou em ambos (padrão).
    """
    from .models import MetaConnection

    if not feed and not story:
        return

    connections = MetaConnection.objects.filter(is_active=True)
    if not connections.exists():
        return

    local_file = _framed_photo_path(objeto, prefixo=prefixo)
    image_url = _framed_public_url(local_file) if local_file else None
    obj_id = objeto.pk

    for connection in connections:
        # Facebook — feed
        if feed:
            _tentar(obj_id, nome_log, "facebook",
                    lambda c=connection: _fb_feed_photo(c, message, local_file))
        # Facebook — story (best-effort; só se houver imagem)
        if story and local_file:
            _tentar(obj_id, nome_log, "facebook",
                    lambda c=connection: _fb_story(c, local_file), story=True)

        # Instagram — exige instagram_id e URL pública da foto
        if connection.instagram_id and image_url:
            if feed:
                _tentar(obj_id, nome_log, "instagram",
                        lambda c=connection: _ig_feed(c, image_url, caption))
            if story:
                _tentar(obj_id, nome_log, "instagram",
                        lambda c=connection: _ig_story(c, image_url), story=True)
        else:
            _registrar_falha_meta(
                obj_id, nome_log, "instagram",
                "Pulado: Instagram não configurado (sem instagram_id) ou sem URL "
                "pública da foto (verifique SITE_URL).",
            )


def auto_post_animal(animal, feed=True, story=True):
    mensagem = build_post_message(animal)
    _publicar(
        animal, prefixo="animal", nome_log=animal.nome_animal,
        message=mensagem, caption=mensagem, feed=feed, story=story,
    )


def auto_post_publicacao(publicacao, feed=True, story=True):
    mensagem = build_post_message_publicacao(publicacao)
    _publicar(
        publicacao, prefixo="pub", nome_log=publicacao.titulo,
        message=mensagem, caption=mensagem, feed=feed, story=story,
    )
