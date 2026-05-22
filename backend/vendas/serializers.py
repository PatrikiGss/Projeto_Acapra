from rest_framework import serializers
from .models import Produto


class ProdutoSerializer(serializers.ModelSerializer):
    """
    Serializer para criar/atualizar produtos.
    """
    class Meta:
        model = Produto
        fields = ['id', 'nome', 'descricao', 'tipo', 'preco', 'foto', 'estoque', 'ativo']


class GetProdutoSerializer(serializers.ModelSerializer):
    """
    Serializer para listagem pública de produtos.
    """
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    
    class Meta:
        model = Produto
        fields = ['id', 'nome', 'descricao', 'tipo', 'tipo_display', 'preco', 'foto', 'estoque', 'created_at']
        read_only_fields = ['id', 'created_at']


class UpdateProdutoSerializer(serializers.ModelSerializer):
    """
    Serializer para atualizar produtos.
    """
    class Meta:
        model = Produto
        fields = ['nome', 'descricao', 'tipo', 'preco', 'foto', 'estoque', 'ativo']
