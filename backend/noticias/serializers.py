from django.db import transaction
from django.db.models import Max
from rest_framework import serializers

from core.images import (
    LIMITE_FOTOS,
    apagar_arquivos,
    aplicar_remocao_imagens,
    coletar_ids_remover,
    contar_imagens_removidas,
    galeria_editavel,
    validar_limite_fotos,
)
from core.validators import validate_image_upload
from .models import Publicacao, PublicacaoImagem


def _absolute_file_url(request, file_field):
    if not file_field:
        return None

    return file_field.url


def _ordered_image_urls(images):
    return [image.imagem.url for image in images if image.imagem]


def _extra_fotos(serializer, validated_data):
    fotos = validated_data.pop("fotos", [])
    if fotos:
        return fotos

    request = serializer.context.get("request")
    if request is not None:
        return request.FILES.getlist("fotos")

    return []


def _criar_imagens_publicacao(publicacao, fotos):
    if not fotos:
        return

    ultima_ordem = publicacao.imagens.aggregate(max_ordem=Max("ordem"))["max_ordem"]
    proxima_ordem = (ultima_ordem + 1) if ultima_ordem is not None else 0

    for indice, foto in enumerate(fotos):
        PublicacaoImagem.objects.create(
            publicacao=publicacao,
            imagem=foto,
            ordem=proxima_ordem + indice,
        )


class PublicacaoWriteSerializer(serializers.ModelSerializer):
    fotos = serializers.ListField(
        child=serializers.ImageField(validators=[validate_image_upload]),
        required=False,
        write_only=True,
        max_length=LIMITE_FOTOS,
    )
    remover_foto = serializers.BooleanField(required=False, write_only=True, default=False)

    class Meta:
        model = Publicacao
        fields = ["id", "categoria", "titulo", "resumo", "foto", "fotos", "remover_foto", "texto", "ativo"]

    def _qtd_fotos_novas(self, attrs):
        fotos = attrs.get("fotos")
        if fotos is None:
            request = self.context.get("request")
            fotos = request.FILES.getlist("fotos") if request is not None else []
        return len(fotos)

    def validate(self, attrs):
        validar_limite_fotos(
            self.instance,
            bool(attrs.get("foto")),
            self._qtd_fotos_novas(attrs),
            remover_foto=attrs.get("remover_foto", False),
            qtd_imagens_removidas=contar_imagens_removidas(self.instance, self.context.get("request")),
        )
        return attrs

    def create(self, validated_data):
        validated_data.pop("remover_foto", None)
        fotos = _extra_fotos(self, validated_data)

        with transaction.atomic():
            publicacao = Publicacao.objects.create(**validated_data)
            _criar_imagens_publicacao(publicacao, fotos)

        return publicacao

    def update(self, instance, validated_data):
        remover_foto = validated_data.pop("remover_foto", False)
        ids_remover = coletar_ids_remover(self.context.get("request"))
        fotos = _extra_fotos(self, validated_data)

        with transaction.atomic():
            arquivos_orfaos = aplicar_remocao_imagens(
                instance, remover_foto=remover_foto, ids_remover=ids_remover
            )
            publicacao = super().update(instance, validated_data)
            _criar_imagens_publicacao(publicacao, fotos)

        # Apaga os arquivos só após o commit (deleção de arquivo não é transacional).
        apagar_arquivos(arquivos_orfaos)
        return publicacao


class GetPublicacaoSerializer(serializers.ModelSerializer):
    categoria_display = serializers.CharField(source="get_categoria_display", read_only=True)
    foto = serializers.SerializerMethodField()
    fotos = serializers.SerializerMethodField()
    galeria = serializers.SerializerMethodField()

    class Meta:
        model = Publicacao
        fields = [
            "id",
            "categoria",
            "categoria_display",
            "titulo",
            "resumo",
            "foto",
            "fotos",
            "galeria",
            "texto",
            "ativo",
            "created_at",
        ]
        read_only_fields = fields

    def get_galeria(self, obj):
        return galeria_editavel(obj)

    def get_foto(self, obj):
        request = self.context.get("request")
        if obj.foto:
            return _absolute_file_url(request, obj.foto)

        primeira_imagem = obj.imagens.first()
        return primeira_imagem.imagem.url if primeira_imagem and primeira_imagem.imagem else None

    def get_fotos(self, obj):
        urls = []

        if obj.foto:
            urls.append(obj.foto.url)

        urls.extend(_ordered_image_urls(obj.imagens.all()))

        return list(dict.fromkeys(url for url in urls if url))
