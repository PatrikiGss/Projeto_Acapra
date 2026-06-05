class SecurityHeadersMiddleware:
    """Adiciona cabeçalhos HTTP de segurança em todas as respostas da API."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        response["X-Content-Type-Options"] = "nosniff"
        response["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        response["Content-Security-Policy"] = (
            "default-src 'none'; "
            "frame-ancestors 'none'"
        )
        return response
