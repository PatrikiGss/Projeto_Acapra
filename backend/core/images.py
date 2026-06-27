"""
Compressão de imagens enviadas pelos usuários.

Toda imagem nova passa por aqui antes de ser persistida: é reorientada pelo EXIF,
redimensionada para um teto sensato e reencodada em WebP com qualidade alta o
suficiente para não degradar visivelmente. Evita que fotos pesadas (vindas de
celular, com vários MB) ocupem disco à toa e deixem o site lento.

Uso típico: herde `CompressImageOnSaveMixin` no model e liste os campos de
imagem em `campos_imagem_comprimir`. A compressão acontece sozinha no save().
"""
import io
import os

from django.core.files.base import ContentFile
from django.core.files.uploadedfile import UploadedFile

# Maior lado da imagem em pixels e qualidade do WebP.
MAX_SIDE = 1600
QUALITY = 82

# Máximo de fotos por cadastro (foto principal + adicionais).
LIMITE_FOTOS = 4


def validar_limite_fotos(instance, tem_foto_nova, qtd_fotos_novas, *, limite=LIMITE_FOTOS):
    """
    Garante que um cadastro não ultrapasse `limite` fotos no total.

    Conta a foto principal (existente ou recém-enviada) + as imagens já salvas
    na relação `imagens` + as novas fotos do lote. Levanta ValidationError do DRF
    quando o resultado passaria do limite. Deve ser chamado no `validate()` dos
    serializers de escrita.
    """
    from rest_framework import serializers

    foto_final = 1 if (tem_foto_nova or (instance is not None and getattr(instance, "foto", None))) else 0
    existentes = instance.imagens.count() if instance is not None else 0
    total = foto_final + existentes + qtd_fotos_novas
    if total > limite:
        raise serializers.ValidationError(
            {"fotos": f"Máximo de {limite} fotos por cadastro (você ficaria com {total})."}
        )


def compress_uploaded_image(file, *, max_side=MAX_SIDE, quality=QUALITY):
    """
    Recebe um arquivo de imagem e devolve um `ContentFile` WebP comprimido.

    Devolve None se não for possível processar (formato inesperado, GIF animado
    ou erro de leitura) — nesse caso o chamador mantém o arquivo original.
    """
    try:
        from PIL import Image, ImageOps

        file.seek(0)
        img = Image.open(file)

        # GIF animado: comprimir perderia a animação, então não mexemos.
        if getattr(img, "is_animated", False):
            return None

        img = ImageOps.exif_transpose(img)

        tem_alpha = img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info)
        img = img.convert("RGBA" if tem_alpha else "RGB")

        largura, altura = img.size
        maior = max(largura, altura)
        if maior > max_side:
            escala = max_side / maior
            img = img.resize((round(largura * escala), round(altura * escala)), Image.LANCZOS)

        buffer = io.BytesIO()
        img.save(buffer, format="WEBP", quality=quality, method=6)
        buffer.seek(0)
        return ContentFile(buffer.read())
    except Exception:
        return None


def comprimir_campo_imagem(field_file, **kwargs):
    """
    Comprime in-place um ImageField/FileField recém-enviado, trocando o arquivo
    por uma versão WebP. Deve ser chamado no save() ANTES de persistir.

    Só age sobre uploads frescos (ainda não salvos no storage); arquivos já
    persistidos são ignorados, então chamar de novo é seguro/idempotente.
    """
    if not field_file:
        return

    arquivo = getattr(field_file, "file", None)
    if not isinstance(arquivo, UploadedFile):
        return

    conteudo = compress_uploaded_image(arquivo, **kwargs)
    if conteudo is None:
        return

    base = os.path.splitext(os.path.basename(field_file.name or "imagem"))[0]
    field_file.save(f"{base}.webp", conteudo, save=False)


class CompressImageOnSaveMixin:
    """
    Mixin para models com campos de imagem.

    Liste os campos em `campos_imagem_comprimir` e a compressão para WebP
    acontece automaticamente no save() — cobre API, admin e qualquer outro
    caminho que persista o objeto.
    """

    campos_imagem_comprimir = ()

    def save(self, *args, **kwargs):
        for nome_campo in self.campos_imagem_comprimir:
            comprimir_campo_imagem(getattr(self, nome_campo))
        super().save(*args, **kwargs)
