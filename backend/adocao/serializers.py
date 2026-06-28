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
from .models import Animal, AnimalImagem


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


def _criar_imagens_animal(animal, fotos):
    if not fotos:
        return

    ultima_ordem = animal.imagens.aggregate(max_ordem=Max("ordem"))["max_ordem"]
    proxima_ordem = (ultima_ordem + 1) if ultima_ordem is not None else 0

    for indice, foto in enumerate(fotos):
        AnimalImagem.objects.create(
            animal=animal,
            imagem=foto,
            ordem=proxima_ordem + indice,
        )


class AnimalSerializer(serializers.ModelSerializer):
    fotos = serializers.ListField(
        child=serializers.ImageField(validators=[validate_image_upload]),
        required=False,
        write_only=True,
        max_length=LIMITE_FOTOS,
    )

    class Meta:
        model = Animal
        fields = ['nome_animal', 'nome_doador', 'telefone', 'especie', 'sexo', 'foto', 'fotos', 'descricao', 'disponivel']

    def validate(self, attrs):
        validar_limite_fotos(self.instance, bool(attrs.get("foto")), _contar_fotos_novas(self, attrs))
        return attrs

    def create(self, validated_data):
        fotos = _extra_fotos_from_validated_data(self, validated_data)

        with transaction.atomic():
            animal = Animal.objects.create(**validated_data)
            _criar_imagens_animal(animal, fotos)

        return animal

class GetAnimalSerializer(serializers.ModelSerializer):
    foto = serializers.SerializerMethodField()
    fotos = serializers.SerializerMethodField()
    galeria = serializers.SerializerMethodField()

    class Meta:
        model = Animal
        fields = ['id','nome_animal', 'nome_doador','telefone','especie','sexo','foto','fotos','galeria','descricao','disponivel']

    def get_galeria(self, obj):
        return galeria_editavel(obj)

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

class UpdateAnimalSerializer(serializers.ModelSerializer):
    fotos = serializers.ListField(
        child=serializers.ImageField(validators=[validate_image_upload]),
        required=False,
        write_only=True,
        max_length=LIMITE_FOTOS,
    )
    remover_foto = serializers.BooleanField(required=False, write_only=True, default=False)

    class Meta:
        model = Animal
        fields = ['nome_animal', 'nome_doador', 'especie', 'sexo', 'foto', 'fotos', 'remover_foto', 'descricao', 'disponivel']

    def validate(self, attrs):
        validar_limite_fotos(
            self.instance,
            bool(attrs.get("foto")),
            _contar_fotos_novas(self, attrs),
            remover_foto=attrs.get("remover_foto", False),
            qtd_imagens_removidas=contar_imagens_removidas(self.instance, self.context.get("request")),
        )
        return attrs

    def update(self, instance, validated_data):
        remover_foto = validated_data.pop("remover_foto", False)
        ids_remover = coletar_ids_remover(self.context.get("request"))
        fotos = _extra_fotos_from_validated_data(self, validated_data)

        with transaction.atomic():
            arquivos_orfaos = aplicar_remocao_imagens(
                instance, remover_foto=remover_foto, ids_remover=ids_remover
            )
            animal = super().update(instance, validated_data)
            _criar_imagens_animal(animal, fotos)

        # Apaga os arquivos só após o commit (deleção de arquivo não é transacional).
        apagar_arquivos(arquivos_orfaos)
        return animal
