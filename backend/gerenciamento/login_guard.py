"""
Proteção de login por CONTA (independente de IP) contra brute force.

O rate limiting por IP (core.throttling) controla a *velocidade* de um único
IP, mas não impede um ataque que: (a) varia o IP de origem, ou (b) é lento o
bastante para caber na janela. Esta camada conta as tentativas FALHAS por
e-mail-alvo e bloqueia a conta temporariamente, fechando o brute force
direcionado a um usuário específico.

Características:
- conta apenas FALHAS (HTTP 401); um login bem-sucedido zera os contadores,
  então o usuário legítimo não é penalizado por acertar a senha;
- duas camadas: rajada (poucas falhas em minutos) e teto diário;
- usa o cache do Django (mesma infra do throttling). Em produção, configure
  um cache compartilhado (Redis) para valer entre workers.

Trade-off conhecido (lockout/DoS): um atacante pode, de propósito, errar a
senha de uma vítima para bloquear o login dela durante a janela. Por isso a
trava é TEMPORÁRIA (expira sozinha) e baseada só em falhas. A alternativa sem
esse risco é exigir CAPTCHA no login após N falhas (ver core.captcha).
"""
from decouple import config  # type: ignore
from django.core.cache import cache

# Camada de rajada: poucas falhas em uma janela curta.
ACCOUNT_FAIL_BURST = config("LOGIN_FAIL_BURST", default=5, cast=int)
ACCOUNT_FAIL_BURST_WINDOW = config(
    "LOGIN_FAIL_BURST_WINDOW", default=5 * 60, cast=int
)  # padrão: 5 minutos

# Camada sustentada: teto de falhas por conta numa janela maior. Bloqueio mais
# curto que 24h para reduzir o risco de lockout/DoS de um usuário legítimo.
ACCOUNT_FAIL_DAY = config("LOGIN_FAIL_WINDOW_MAX", default=20, cast=int)
ACCOUNT_FAIL_DAY_WINDOW = config(
    "LOGIN_FAIL_WINDOW_SECONDS", default=60 * 60, cast=int
)  # padrão: 1 hora


def _normalizar(email: str) -> str:
    return (email or "").strip().lower()


def _chaves(email: str):
    alvo = _normalizar(email)
    if not alvo:
        return None
    return (
        (f"login_fail_burst:{alvo}", ACCOUNT_FAIL_BURST, ACCOUNT_FAIL_BURST_WINDOW),
        (f"login_fail_day:{alvo}", ACCOUNT_FAIL_DAY, ACCOUNT_FAIL_DAY_WINDOW),
    )


def conta_bloqueada(email: str) -> bool:
    """True se a conta excedeu o limite de falhas (rajada OU diário)."""
    chaves = _chaves(email)
    if not chaves:
        return False
    return any(cache.get(chave, 0) >= limite for chave, limite, _ in chaves)


def registrar_falha(email: str) -> None:
    """Incrementa os contadores de falha da conta, criando a janela na 1ª vez."""
    chaves = _chaves(email)
    if not chaves:
        return
    for chave, _limite, janela in chaves:
        if cache.get(chave) is None:
            cache.set(chave, 1, janela)
        else:
            try:
                cache.incr(chave)
            except ValueError:
                # Expirou entre o get e o incr: recria a janela.
                cache.set(chave, 1, janela)


def limpar_falhas(email: str) -> None:
    """Zera os contadores após um login bem-sucedido."""
    chaves = _chaves(email)
    if not chaves:
        return
    for chave, _limite, _janela in chaves:
        cache.delete(chave)
