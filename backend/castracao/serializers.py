from rest_framework import serializers

from .models import PedidoCastracao


class CreatePedidoCastracaoSerializer(serializers.ModelSerializer):
    """
    Serializer para criação pública de pedidos de castração.

    `status` fica de fora: quem envia o pedido não escolhe o andamento.
    """

    class Meta:
        model = PedidoCastracao
        fields = ['nome', 'telefone', 'email', 'tipo_animal', 'sexo', 'observacoes']

    def validate_nome(self, value):
        nome = value.strip()
        if len(nome) < 3:
            raise serializers.ValidationError("Informe o nome completo (mínimo 3 caracteres).")
        return nome


class GetPedidoCastracaoSerializer(serializers.ModelSerializer):
    """
    Serializer para listagem/detalhe dos pedidos (uso administrativo).
    """

    tipo_animal_display = serializers.CharField(source='get_tipo_animal_display', read_only=True)
    sexo_display = serializers.CharField(source='get_sexo_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = PedidoCastracao
        fields = [
            'id',
            'nome',
            'telefone',
            'email',
            'tipo_animal',
            'tipo_animal_display',
            'sexo',
            'sexo_display',
            'observacoes',
            'status',
            'status_display',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class PedidoCastracaoStatusSerializer(serializers.ModelSerializer):
    """
    Serializer para atualização do andamento pelo administrador.
    """

    class Meta:
        model = PedidoCastracao
        fields = ['status']
