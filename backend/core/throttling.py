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
    """Limite de rajada: poucas tentativas de login por minuto por IP."""
    scope = "login"


class LoginDailyRateThrottle(_BaseIPThrottle):
    """Teto diário de tentativas de login por IP (anti brute force sustentado)."""
    scope = "login_day"


class RegisterRateThrottle(_BaseIPThrottle):
    """Limite de rajada: poucos registros por minuto a partir do mesmo IP."""
    scope = "register"


class RegisterDailyRateThrottle(_BaseIPThrottle):
    """Limite sustentado: teto diário de registros por IP (anti-abuso em massa)."""
    scope = "register_day"


class RefreshRateThrottle(_BaseIPThrottle):
    scope = "refresh"


class PasswordResetRateThrottle(_BaseIPThrottle):
    scope = "password_reset"


class PublicFormRateThrottle(_BaseIPThrottle):
    scope = "public_form"
