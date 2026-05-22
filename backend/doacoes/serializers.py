from rest_framework import serializers
from .models import DadosPix


class DadosPixSerializer(serializers.ModelSerializer):
    """
    Serializer para retornar os dados de Pix publicamente.
    """
    class Meta:
        model = DadosPix
        fields = ['id', 'chave_pix', 'qr_code', 'descricao', 'ativo']
        read_only_fields = ['id', 'qr_code', 'descricao', 'ativo']


class GetDadosPixSerializer(serializers.ModelSerializer):
    """
    Serializer para listagem pública de dados Pix.
    """
    class Meta:
        model = DadosPix
        fields = ['id', 'chave_pix', 'qr_code', 'descricao']
        read_only_fields = ['id', 'chave_pix', 'qr_code', 'descricao']
