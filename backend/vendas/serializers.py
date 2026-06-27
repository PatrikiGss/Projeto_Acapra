from django.db import transaction
from django.db.models import Max
from rest_framework import serializers

from core.images import LIMITE_FOTOS, validar_limite_fotos
from core.validators import validate_image_upload
from .models import Produto, ProdutoImagem


def _contar_fotos_novas(serializer, attrs):
    fotos = attrs.get("fotos")
    if fotos is None:
        request = serializer.context.get("request")
        fotos = request.FILES.getlist("fotos") if request is not None else []
    return len(fotos)


def _absolute_file_url(request, file_field):
    if not file_field:
        return None

    return file_field.url


def _ordered_image_urls(request, images):
    return [
        _absolute_file_url(request, image.imagem)
        for image in images
        if image.imagem
    ]


def _extra_fotos_from_validated_data(serializer, validated_data):
    fotos = validated_data.pop("fotos", [])
    if fotos:
        return fotos

    request = serializer.context.get("request")
    if request is not None:
        return request.FILES.getlist("fotos")

    return []


def _criar_imagens_produto(produto, fotos):
    if not fotos:
        return

    ultima_ordem = produto.imagens.aggregate(max_ordem=Max("ordem"))["max_ordem"]
    proxima_ordem = (ultima_ordem + 1) if ultima_ordem is not None else 0

    for indice, foto in enumerate(fotos):
        ProdutoImagem.objects.create(
            produto=produto,
            imagem=foto,
            ordem=proxima_ordem + indice,
        )


class ProdutoSerializer(serializers.ModelSerializer):
    """
    Serializer para criar/atualizar produtos.
    """
    fotos = serializers.ListField(
        child=serializers.ImageField(validators=[validate_image_upload]),
        required=False,
        write_only=True,
        max_length=LIMITE_FOTOS,
    )

    class Meta:
        model = Produto
        fields = ['id', 'nome', 'descricao', 'tipo', 'preco', 'foto', 'fotos', 'estoque', 'ativo']

    def validate(self, attrs):
        validar_limite_fotos(self.instance, bool(attrs.get("foto")), _contar_fotos_novas(self, attrs))
        return attrs

    def create(self, validated_data):
        fotos = _extra_fotos_from_validated_data(self, validated_data)

        with transaction.atomic():
            produto = Produto.objects.create(**validated_data)
            _criar_imagens_produto(produto, fotos)

        return produto


class GetProdutoSerializer(serializers.ModelSerializer):
    """
    Serializer para listagem pública de produtos.
    """
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    foto = serializers.SerializerMethodField()
    fotos = serializers.SerializerMethodField()
    
    class Meta:
        model = Produto
        fields = ['id', 'nome', 'descricao', 'tipo', 'tipo_display', 'preco', 'foto', 'fotos', 'estoque', 'ativo', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_foto(self, obj):
        request = self.context.get('request')
        if obj.foto:
            return _absolute_file_url(request, obj.foto)

        primeira_imagem = obj.imagens.first()
        return _absolute_file_url(request, primeira_imagem.imagem) if primeira_imagem else None

    def get_fotos(self, obj):
        request = self.context.get('request')
        imagens = []

        if obj.foto:
            imagens.append(_absolute_file_url(request, obj.foto))

        imagens.extend(_ordered_image_urls(request, obj.imagens.all()))

        return list(dict.fromkeys(imagem for imagem in imagens if imagem))


class UpdateProdutoSerializer(serializers.ModelSerializer):
    """
    Serializer para atualizar produtos.
    """
    fotos = serializers.ListField(
        child=serializers.ImageField(validators=[validate_image_upload]),
        required=False,
        write_only=True,
        max_length=LIMITE_FOTOS,
    )

    class Meta:
        model = Produto
        fields = ['nome', 'descricao', 'tipo', 'preco', 'foto', 'fotos', 'estoque', 'ativo']

    def validate(self, attrs):
        validar_limite_fotos(self.instance, bool(attrs.get("foto")), _contar_fotos_novas(self, attrs))
        return attrs

    def update(self, instance, validated_data):
        fotos = _extra_fotos_from_validated_data(self, validated_data)

        with transaction.atomic():
            produto = super().update(instance, validated_data)
            _criar_imagens_produto(produto, fotos)

        return produto
