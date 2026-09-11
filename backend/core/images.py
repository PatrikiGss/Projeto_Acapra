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
import logging
import os

from django.core.files.base import ContentFile
from django.core.files.uploadedfile import UploadedFile

logger = logging.getLogger(__name__)

# Maior lado da imagem em pixels e qualidade do WebP.
MAX_SIDE = 1600
QUALITY = 82

# Máximo de fotos por cadastro (foto principal + adicionais).
LIMITE_FOTOS = 4


def validar_limite_fotos(
    instance,
    tem_foto_nova,
    qtd_fotos_novas,
    *,
    limite=LIMITE_FOTOS,
    remover_foto=False,
    qtd_imagens_removidas=0,
):
    """
    Garante que um cadastro não ultrapasse `limite` fotos no total.

    Conta a foto principal (existente ou recém-enviada) + as imagens já salvas
    na relação `imagens` + as novas fotos do lote, descontando o que será
    removido nesta edição (`remover_foto` e `qtd_imagens_removidas`). Levanta
    ValidationError do DRF quando o resultado passaria do limite. Deve ser
    chamado no `validate()` dos serializers de escrita.
    """
    from rest_framework import serializers

    foto_existente = bool(instance is not None and getattr(instance, "foto", None)) and not remover_foto
    foto_final = 1 if (tem_foto_nova or foto_existente) else 0
    existentes = instance.imagens.count() if instance is not None else 0
    existentes = max(0, existentes - qtd_imagens_removidas)
    total = foto_final + existentes + qtd_fotos_novas
    if total > limite:
        raise serializers.ValidationError(
            {"fotos": f"Máximo de {limite} fotos por cadastro (você ficaria com {total})."}
        )


def coletar_ids_remover(request, campo="remover_imagens"):
    """
    Lê do request a lista de ids de imagens da galeria a remover.

    Funciona tanto com multipart (QueryDict, chaves repetidas via getlist) quanto
    com JSON (lista). Ignora valores não numéricos. Espelha a leitura manual de
    `fotos`, já que o ListField do DRF não captura chaves repetidas em multipart.
    """
    if request is None:
        return []

    data = request.data
    if hasattr(data, "getlist"):
        valores = data.getlist(campo)
    else:
        valores = data.get(campo, [])
        if not isinstance(valores, (list, tuple)):
            valores = [valores]

    ids = []
    for valor in valores:
        try:
            ids.append(int(valor))
        except (TypeError, ValueError):
            continue
    return ids


def galeria_editavel(obj):
    """
    Lista estruturada das imagens de `obj` para o editor do frontend.

    Devolve a foto principal (quando existe) seguida das imagens da galeria
    `imagens`, cada item com o handle necessário para removê-la individualmente:
      - {"tipo": "principal", "id": None, "url": ...}
      - {"tipo": "galeria",   "id": <int>, "url": ...}
    """
    itens = []
    if getattr(obj, "foto", None):
        itens.append({"tipo": "principal", "id": None, "url": obj.foto.url})
    for img in obj.imagens.all():
        if img.imagem:
            itens.append({"tipo": "galeria", "id": img.id, "url": img.imagem.url})
    return itens


def aplicar_remocao_imagens(instance, *, remover_foto=False, ids_remover=None):
    """
    Aplica as remoções no BANCO e devolve os arquivos a apagar do storage.

    - `remover_foto`: zera o campo da foto principal.
    - `ids_remover`: ids de imagens da relação `imagens` a excluir (escopados à
      própria instância, então ids de outros objetos são ignorados).

    Faz apenas as mudanças de banco e RETORNA a lista de FieldFiles a apagar
    DEPOIS do commit. Deleção de arquivo não é transacional, então adiá-la evita
    perder arquivos caso a transação sofra rollback. Deve ser chamado dentro da
    transação, antes de criar as novas imagens; o chamador apaga os arquivos
    retornados após o `with transaction.atomic()`.
    """
    arquivos = []

    if remover_foto and getattr(instance, "foto", None):
        arquivos.append(instance.foto)
        instance.foto = None

    if ids_remover:
        imagens = instance.imagens.filter(id__in=ids_remover)
        for img in imagens:
            if img.imagem:
                arquivos.append(img.imagem)
        imagens.delete()

    return arquivos


def apagar_arquivos(arquivos):
    """
    Apaga do storage os FieldFiles coletados, em MELHOR-ESFORÇO.

    Deleção de arquivo não é a operação autoritativa (a linha do banco é); por
    isso uma falha de storage vira log e nunca derruba o fluxo. Caso contrário um
    erro ao apagar o arquivo (ex.: arquivo travado no Windows) transformaria uma
    exclusão/edição já persistida num 500 — pior que deixar um arquivo órfão.
    """
    for arquivo in arquivos or []:
        try:
            arquivo.delete(save=False)
        except OSError as exc:
            logger.warning(
                "Falha ao apagar mídia %s: %s", getattr(arquivo, "name", arquivo), exc
            )


def coletar_arquivos_instancia(instance):
    """
    Coleta (sem apagar) a foto principal e as imagens da galeria da instância.

    Usado ao excluir o objeto inteiro: chame ANTES de `instance.delete()` para
    capturar os FieldFiles (as linhas da relação `imagens` somem por cascata) e
    depois passe o resultado a `apagar_arquivos`, já com a linha removida.
    """
    arquivos = []
    if getattr(instance, "foto", None):
        arquivos.append(instance.foto)
    for img in instance.imagens.all():
        if img.imagem:
            arquivos.append(img.imagem)
    return arquivos


def contar_imagens_removidas(instance, request):
    """
    Quantas das imagens pedidas para remoção realmente pertencem à instância.

    Usado em `validate()` para descontar as remoções do limite de fotos.
    """
    ids = coletar_ids_remover(request)
    if not ids or instance is None:
        return 0
    return instance.imagens.filter(id__in=ids).count()


def compress_uploaded_image(file, *, max_side=MAX_SIDE, quality=QUALITY):
    """
    Recebe um arquivo de imagem e devolve um `ContentFile` WebP comprimido.

    Devolve None se não for possível processar (formato inesperado, GIF animado
    ou erro de leitura) — nesse caso o chamador mantém o arquivo original.
    """
    try:
        from PIL import Image, ImageOps

        file.seek(0)
        # Fecha o handle do arquivo de origem ao sair, evitando handles vazados
        # (no Windows, um handle aberto trava o arquivo e bloqueia remoções).
        with Image.open(file) as origem:
            # GIF animado: comprimir perderia a animação, então não mexemos.
            if getattr(origem, "is_animated", False):
                return None

            img = ImageOps.exif_transpose(origem)

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
