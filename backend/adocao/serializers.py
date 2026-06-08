from django.db import transaction
from django.db.models import Max
from rest_framework import serializers

from .models import Animal, AnimalImagem


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
        child=serializers.ImageField(),
        required=False,
        write_only=True,
    )

    class Meta:
        model = Animal
        fields = ['nome_animal', 'nome_doador', 'telefone', 'especie', 'sexo', 'foto', 'fotos', 'descricao']

    def create(self, validated_data):
        fotos = _extra_fotos_from_validated_data(self, validated_data)

        with transaction.atomic():
            animal = Animal.objects.create(**validated_data)
            _criar_imagens_animal(animal, fotos)

        return animal

class GetAnimalSerializer(serializers.ModelSerializer):
    foto = serializers.SerializerMethodField()
    fotos = serializers.SerializerMethodField()

    class Meta:
        model = Animal
        fields = ['id','nome_animal', 'nome_doador','telefone','especie','sexo','foto','fotos','descricao']

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
        child=serializers.ImageField(),
        required=False,
        write_only=True,
    )

    class Meta:
        model = Animal
        fields = ['nome_animal', 'nome_doador', 'especie', 'sexo', 'foto', 'fotos', 'descricao']

    def update(self, instance, validated_data):
        fotos = _extra_fotos_from_validated_data(self, validated_data)

        with transaction.atomic():
            animal = super().update(instance, validated_data)
            _criar_imagens_animal(animal, fotos)

        return animal
