"""
Validação segura de uploads de arquivos.

Aplica, para todo FileField/ImageField:
  - whitelist de extensões;
  - limite de tamanho;
  - verificação do conteúdo real (magic bytes / decodificação via Pillow),
    impedendo que um executável seja renomeado como imagem;
  - bloqueio explícito de extensões executáveis/perigosas.
"""
import os

from django.core.exceptions import ValidationError

# Limites de tamanho (bytes)
MAX_IMAGE_SIZE = 5 * 1024 * 1024       # 5 MB
MAX_DOCUMENT_SIZE = 10 * 1024 * 1024   # 10 MB

ALLOWED_IMAGE_EXTENSIONS = {"jpg", "jpeg", "png", "gif", "webp"}
ALLOWED_DOCUMENT_EXTENSIONS = {"pdf", "jpg", "jpeg", "png", "webp"}

# Extensões que jamais devem ser aceitas (defesa em profundidade).
BLOCKED_EXTENSIONS = {
    "php", "php3", "php4", "php5", "phtml", "phar", "py", "pyc", "rb", "pl",
    "sh", "bash", "exe", "dll", "bat", "cmd", "com", "msi", "jar", "js",
    "mjs", "html", "htm", "svg", "xml", "asp", "aspx", "jsp", "cgi", "so",
}

# Assinaturas (magic bytes) por tipo de conteúdo permitido.
_MAGIC_SIGNATURES = {
    "jpg": [b"\xff\xd8\xff"],
    "jpeg": [b"\xff\xd8\xff"],
    "png": [b"\x89PNG\r\n\x1a\n"],
    "gif": [b"GIF87a", b"GIF89a"],
    "webp": [b"RIFF"],          # RIFF....WEBP
    "pdf": [b"%PDF-"],
}


def _get_extension(name: str) -> str:
    return os.path.splitext(name or "")[1].lower().lstrip(".")


def _read_header(file_obj, size: int = 32) -> bytes:
    pos = file_obj.tell() if hasattr(file_obj, "tell") else 0
    try:
        file_obj.seek(0)
        header = file_obj.read(size)
    finally:
        try:
            file_obj.seek(pos)
        except (OSError, ValueError):
            pass
    return header or b""


def _check_magic(file_obj, ext: str) -> bool:
    header = _read_header(file_obj)
    if not header:
        return False
    signatures = _MAGIC_SIGNATURES.get(ext, [])
    if ext == "webp":
        return header[:4] == b"RIFF" and header[8:12] == b"WEBP"
    return any(header.startswith(sig) for sig in signatures)


def _validate(file, *, allowed_extensions, max_size, verify_image):
    if file is None:
        return

    name = getattr(file, "name", "") or ""
    ext = _get_extension(name)

    if not ext:
        raise ValidationError("Arquivo sem extensão não é permitido.")

    if ext in BLOCKED_EXTENSIONS:
        raise ValidationError("Tipo de arquivo não permitido por motivos de segurança.")

    if ext not in allowed_extensions:
        raise ValidationError(
            "Extensão não permitida. Permitidos: %s."
            % ", ".join(sorted(allowed_extensions))
        )

    size = getattr(file, "size", None)
    if size is not None and size > max_size:
        raise ValidationError(
            "Arquivo muito grande. Tamanho máximo: %d MB." % (max_size // (1024 * 1024))
        )

    # Verifica o conteúdo real, não apenas a extensão/nome.
    if not _check_magic(file, ext):
        raise ValidationError("O conteúdo do arquivo não corresponde à extensão informada.")

    if verify_image and ext != "pdf":
        try:
            from PIL import Image

            pos = file.tell() if hasattr(file, "tell") else 0
            file.seek(0)
            img = Image.open(file)
            img.verify()
            file.seek(pos)
        except Exception:
            raise ValidationError("Arquivo de imagem inválido ou corrompido.")


def validate_image_upload(file):
    """Valida imagens (jpg/jpeg/png/gif/webp)."""
    _validate(
        file,
        allowed_extensions=ALLOWED_IMAGE_EXTENSIONS,
        max_size=MAX_IMAGE_SIZE,
        verify_image=True,
    )


def validate_document_upload(file):
    """Valida documentos/comprovantes (pdf + imagens)."""
    _validate(
        file,
        allowed_extensions=ALLOWED_DOCUMENT_EXTENSIONS,
        max_size=MAX_DOCUMENT_SIZE,
        verify_image=True,
    )
