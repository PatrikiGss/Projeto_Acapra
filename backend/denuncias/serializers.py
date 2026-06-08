# serializers.py

from rest_framework import serializers
from .models import Denuncia


class DenunciaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Denuncia
        fields = "__all__"


class GetDenunciaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Denuncia
        fields = [
            "id",
            "Titulo",
            "Resumo",
            "Gravidade",
            "nome",
            "foto"
        ]


class UpdateDenunciaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Denuncia
        fields = [
            "Titulo",
            "Resumo",
            "Gravidade",
            "nome",
            "telefone",
            "foto"
        ]