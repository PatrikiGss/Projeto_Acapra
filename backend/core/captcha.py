"""
Resolução do IP real de origem das requisições.

Usado por logs de auditoria e throttling para identificar o cliente de forma
confiável, respeitando o nº de proxies confiáveis (NUM_PROXIES) à frente do app.
"""
from django.conf import settings


def _num_proxies() -> int:
    """Nº de proxies confiáveis à frente do app (mesma fonte do throttling)."""
    rest = getattr(settings, "REST_FRAMEWORK", {}) or {}
    try:
        return int(rest.get("NUM_PROXIES", 0) or 0)
    except (TypeError, ValueError):
        return 0


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
