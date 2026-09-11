import secrets


class SecurityHeadersMiddleware:
    """Adiciona cabeçalhos HTTP de segurança, incluindo CSP com nonce."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Nonce por requisição, disponível para templates (admin/DRF) que
        # precisem de scripts inline legítimos.
        nonce = secrets.token_urlsafe(16)
        request.csp_nonce = nonce

        response = self.get_response(request)

        response["X-Content-Type-Options"] = "nosniff"
        response["X-Frame-Options"] = "DENY"
        response["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response["Permissions-Policy"] = (
            "camera=(), microphone=(), geolocation=(), payment=(), usb=()"
        )
        response["Cross-Origin-Opener-Policy"] = "same-origin"

        csp = [
            "default-src 'self'",
            # Sem 'unsafe-inline'/'unsafe-eval' para scripts: usa nonce.
            f"script-src 'self' 'nonce-{nonce}'",
            # style-src mantém 'unsafe-inline' por necessidade do Django admin
            # e da DRF browsable API (apenas estilos, baixo risco).
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob:",
            "font-src 'self' data:",
            "connect-src 'self'",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'none'",
        ]

        response["Content-Security-Policy"] = "; ".join(csp)

        return response
