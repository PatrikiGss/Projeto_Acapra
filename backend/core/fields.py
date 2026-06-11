"""
Campos de modelo com criptografia transparente em repouso.

`EncryptedTextField` criptografa o valor ao gravar no banco e descriptografa ao
ler, de forma transparente para o restante da aplicação. Registros legados em
texto plano continuam legíveis (ver `core.crypto.decrypt_value`).
"""
from django.db import models

from .crypto import decrypt_value, encrypt_value


class EncryptedTextField(models.TextField):
    """TextField cujo conteúdo é armazenado criptografado (Fernet)."""

    description = "TextField criptografado em repouso"

    def from_db_value(self, value, expression, connection):
        if value is None:
            return value
        return decrypt_value(value)

    def to_python(self, value):
        if value is None:
            return value
        # Já é texto plano em memória.
        return value

    def get_prep_value(self, value):
        if value is None or value == "":
            return value
        return encrypt_value(value)
