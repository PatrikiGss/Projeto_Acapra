from rest_framework import serializers
from .models import Animal

class AnimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Animal
        fields = "__all__"

class GetAnimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Animal
        fields = ['nome_doador','especie','sexo','foto','descricao','created_at']

class UpdateAnimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Animal
        fields = ['nome_doador','especie','sexo','foto','descricao']
