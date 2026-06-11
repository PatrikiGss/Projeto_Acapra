"""
Geração de caminhos de upload seguros.

Os nomes de arquivo enviados pelo cliente NUNCA são usados diretamente: o nome
é descartado e substituído por um identificador aleatório, preservando apenas a
extensão (já validada). Isso evita path traversal, sobrescrita de arquivos e
nomes maliciosos.
"""
import os
import uuid


def _safe_extension(filename: str) -> str:
    ext = os.path.splitext(filename or "")[1].lower()
    # Mantém apenas caracteres alfanuméricos na extensão.
    ext = "".join(c for c in ext if c.isalnum() or c == ".")
    return ext or ".bin"


def _factory(subdir: str):
    def upload_to(instance, filename):
        from datetime import datetime

        ext = _safe_extension(filename)
        date_path = datetime.now().strftime("%Y/%m/%d")
        new_name = f"{uuid.uuid4().hex}{ext}"
        return f"{subdir}/{date_path}/{new_name}"

    return upload_to


# Funções nomeadas (necessário para serem serializáveis em migrations).
def upload_fotos(instance, filename):
    return _factory("fotos")(instance, filename)


def upload_noticias(instance, filename):
    return _factory("noticias")(instance, filename)


def upload_produtos(instance, filename):
    return _factory("produtos")(instance, filename)


def upload_qr_codes(instance, filename):
    return _factory("qr_codes")(instance, filename)


def upload_transparencia(instance, filename):
    return _factory("transparencia")(instance, filename)


def upload_transparencia_documentos(instance, filename):
    return _factory("transparencia/documentos")(instance, filename)
