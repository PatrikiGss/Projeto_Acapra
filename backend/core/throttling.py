"""
Classes de throttling (rate limiting) baseadas em IP.

As taxas são definidas em settings.REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"].
Todas estas classes limitam por endereço IP do cliente, inclusive para
usuários autenticados, protegendo endpoints sensíveis contra força bruta e
abuso automatizado.
"""
from rest_framework.throttling import SimpleRateThrottle


class _BaseIPThrottle(SimpleRateThrottle):
    """Limita sempre pelo IP de origem."""

    scope = "anon"

    def get_cache_key(self, request, view):
        ident = self.get_ident(request)
        return self.cache_format % {"scope": self.scope, "ident": ident}


class LoginRateThrottle(_BaseIPThrottle):
    scope = "login"


class RegisterRateThrottle(_BaseIPThrottle):
    scope = "register"


class RefreshRateThrottle(_BaseIPThrottle):
    scope = "refresh"


class PasswordResetRateThrottle(_BaseIPThrottle):
    scope = "password_reset"


class PublicFormRateThrottle(_BaseIPThrottle):
    scope = "public_form"
