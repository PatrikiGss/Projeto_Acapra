"""
Verificação de CAPTCHA (Cloudflare Turnstile).

Protege endpoints públicos sensíveis (ex.: registro) contra automação/bots.

Comportamento:
- Em desenvolvimento/testes o CAPTCHA fica desligado por padrão
  (`CAPTCHA_ENABLED=False`) e a verificação sempre passa — assim os testes
  automatizados e o ambiente local não precisam de chaves.
- Em produção, defina `CAPTCHA_ENABLED=True` e `TURNSTILE_SECRET_KEY` no
  ambiente. A partir daí, todo registro precisa de um token válido.
"""
import requests
from django.conf import settings

TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"


def captcha_ativo():
    """O CAPTCHA só é exigido quando habilitado E com secret configurada."""
    return bool(
        getattr(settings, "CAPTCHA_ENABLED", False)
        and getattr(settings, "TURNSTILE_SECRET_KEY", "")
    )


def get_client_ip(request):
    """IP de origem da requisição (respeita proxy via X-Forwarded-For)."""
    encaminhado = request.META.get("HTTP_X_FORWARDED_FOR", "")
    if encaminhado:
        return encaminhado.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "")


def verificar_captcha(token, remote_ip=None):
    """
    Retorna True se o CAPTCHA estiver desativado ou se o token for válido.
    Em caso de token ausente ou falha de verificação, retorna False.
    """
    if not captcha_ativo():
        return True

    if not token:
        return False

    try:
        resposta = requests.post(
            TURNSTILE_VERIFY_URL,
            data={
                "secret": settings.TURNSTILE_SECRET_KEY,
                "response": token,
                "remoteip": remote_ip or "",
            },
            timeout=5,
        )
        resultado = resposta.json()
    except (requests.RequestException, ValueError):
        # Indisponibilidade do provedor ou resposta inválida: nega por segurança.
        return False

    return bool(resultado.get("success"))
