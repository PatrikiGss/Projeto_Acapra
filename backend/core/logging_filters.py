"""
Filtro de logging que redige dados sensíveis.

Impede que senhas, tokens JWT, tokens de acesso Meta, refresh tokens e segredos
sejam gravados nos logs, mesmo que apareçam acidentalmente em mensagens de log.
"""
import logging
import re

_PATTERNS = [
    # chave=valor ou "chave": "valor"
    re.compile(
        r'(?i)(password|senha|secret|token|access|refresh|authorization|api[_-]?key)'
        r'(["\']?\s*[:=]\s*["\']?)([^"\'\s,&}]+)'
    ),
    # Bearer <jwt>
    re.compile(r'(?i)(bearer\s+)([A-Za-z0-9\-_\.]+)'),
]

_REDACTED = "***REDACTED***"


def _redact(text: str) -> str:
    if not text:
        return text
    for pattern in _PATTERNS:
        if pattern.groups == 3:
            text = pattern.sub(lambda m: m.group(1) + m.group(2) + _REDACTED, text)
        else:
            text = pattern.sub(lambda m: m.group(1) + _REDACTED, text)
    return text


class SensitiveDataFilter(logging.Filter):
    def filter(self, record):
        try:
            if isinstance(record.msg, str):
                record.msg = _redact(record.msg)
            if record.args:
                if isinstance(record.args, dict):
                    record.args = {k: _redact(str(v)) for k, v in record.args.items()}
                else:
                    record.args = tuple(_redact(str(a)) for a in record.args)
        except Exception:
            pass
        return True
