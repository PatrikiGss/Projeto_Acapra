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


class PasswordChangeRateThrottle(SimpleRateThrottle):
    """Rate limit por user_id para endpoint autenticado de troca de senha.

    Usar user_id (não IP) porque o endpoint exige autenticação: o que importa
    é quantas tentativas o mesmo usuário faz, independente de qual IP ele usa.
    """
    scope = "password_change"

    def get_cache_key(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return None
        return self.cache_format % {
            "scope": self.scope,
            "ident": request.user.pk,
        }
