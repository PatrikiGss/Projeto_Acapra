from rest_framework import serializers
from .models import DocumentoInstitucional, Indicador


class DocumentoInstitucionalReadSerializer(serializers.ModelSerializer):
    arquivo = serializers.SerializerMethodField()

    class Meta:
        model = DocumentoInstitucional
        fields = ["id", "nome", "descricao", "arquivo", "ativo", "ordem", "created_at"]
        read_only_fields = fields

    def get_arquivo(self, obj):
        if not obj.arquivo:
            return None
        return obj.arquivo.url


class DocumentoInstitucionalWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentoInstitucional
        fields = ["id", "nome", "descricao", "arquivo", "ativo", "ordem"]


class IndicadorReadSerializer(serializers.ModelSerializer):
    chave_display = serializers.CharField(source="get_chave_display", read_only=True)

    class Meta:
        model = Indicador
        fields = ["id", "chave", "chave_display", "valor", "updated_at"]
        read_only_fields = fields


class IndicadorWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Indicador
        fields = ["id", "chave", "valor"]
