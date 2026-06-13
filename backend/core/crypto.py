"""
Camada de criptografia simétrica para dados sensíveis em repouso
(ex.: tokens de acesso Meta/Facebook).

Usa Fernet (AES-128-CBC + HMAC-SHA256) da biblioteca `cryptography`.

A chave é lida da variável de ambiente FIELD_ENCRYPTION_KEY (recomendado em
produção, separada do SECRET_KEY). Caso não esteja definida, uma chave é
derivada deterministicamente do SECRET_KEY apenas para manter compatibilidade
em ambientes de desenvolvimento — NUNCA confie nesse fallback em produção.
"""
import base64
import hashlib

from django.conf import settings
from cryptography.fernet import Fernet, InvalidToken


def _derive_key_from_secret() -> bytes:
    """Deriva uma chave Fernet válida (32 bytes url-safe base64) do SECRET_KEY."""
    digest = hashlib.sha256(settings.SECRET_KEY.encode("utf-8")).digest()
    return base64.urlsafe_b64encode(digest)


def _get_fernet() -> Fernet:
    key = getattr(settings, "FIELD_ENCRYPTION_KEY", "") or ""
    if key:
        # Aceita tanto a chave Fernet pronta quanto uma string arbitrária.
        try:
            return Fernet(key.encode("utf-8") if isinstance(key, str) else key)
        except (ValueError, TypeError):
            digest = hashlib.sha256(
                key.encode("utf-8") if isinstance(key, str) else key
            ).digest()
            return Fernet(base64.urlsafe_b64encode(digest))
    return Fernet(_derive_key_from_secret())


def encrypt_value(plaintext: str) -> str:
    """Criptografa uma string. Retorna texto cifrado (str)."""
    if plaintext is None:
        return plaintext
    if not isinstance(plaintext, str):
        plaintext = str(plaintext)
    token = _get_fernet().encrypt(plaintext.encode("utf-8"))
    return token.decode("utf-8")


def decrypt_value(ciphertext: str):
    """
    Descriptografa uma string previamente cifrada.

    Para compatibilidade com registros legados (gravados em texto plano antes
    da introdução da criptografia), retorna o valor original caso ele não seja
    um token Fernet válido.
    """
    if ciphertext is None or ciphertext == "":
        return ciphertext
    raw = ciphertext.encode("utf-8") if isinstance(ciphertext, str) else ciphertext
    try:
        return _get_fernet().decrypt(raw).decode("utf-8")
    except (InvalidToken, ValueError, TypeError):
        # Valor legado em texto plano — devolve como está.
        return ciphertext
