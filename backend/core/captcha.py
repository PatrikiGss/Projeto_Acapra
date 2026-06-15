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


def _num_proxies() -> int:
    """Nº de proxies confiáveis à frente do app (mesma fonte do throttling)."""
    rest = getattr(settings, "REST_FRAMEWORK", {}) or {}
    try:
        return int(rest.get("NUM_PROXIES", 0) or 0)
    except (TypeError, ValueError):
        return 0


def captcha_ativo():
    """O CAPTCHA só é exigido quando habilitado E com secret configurada."""
    return bool(
        getattr(settings, "CAPTCHA_ENABLED", False)
        and getattr(settings, "TURNSTILE_SECRET_KEY", "")
    )


def get_client_ip(request):
    """
    IP real de origem da requisição.

    Espelha a lógica de NUM_PROXIES do DRF para evitar spoofing de
    X-Forwarded-For (o cliente controla esse header):
      - NUM_PROXIES = 0  -> usa apenas REMOTE_ADDR (IP do socket, não forjável);
      - NUM_PROXIES = N  -> usa o IP na posição N a partir do fim do
        X-Forwarded-For, ou seja, o que o proxy confiável inseriu.
    """
    remote_addr = request.META.get("REMOTE_ADDR", "")
    num_proxies = _num_proxies()

    if num_proxies <= 0:
        return remote_addr

    encaminhado = request.META.get("HTTP_X_FORWARDED_FOR", "")
    if not encaminhado:
        return remote_addr

    enderecos = [parte.strip() for parte in encaminhado.split(",") if parte.strip()]
    if not enderecos:
        return remote_addr

    # Posição N a partir do fim: o IP inserido pelo proxy mais externo confiável.
    return enderecos[-min(num_proxies, len(enderecos))]


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
