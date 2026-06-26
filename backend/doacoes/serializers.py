from django.db import transaction
from rest_framework import serializers

from .models import DadosPix, OfertaDoacao


def _absolute_file_url(request, file_field):
    if not file_field:
        return None

    return file_field.url


class DadosPixWriteSerializer(serializers.ModelSerializer):
    remover_qr_code = serializers.BooleanField(required=False, write_only=True, default=False)

    class Meta:
        model = DadosPix
        fields = [
            'id',
            'chave_pix',
            'qr_code',
            'descricao',
            'banco',
            'agencia',
            'conta',
            'tipo_conta',
            'cnpj',
            'favorecido',
            'ativo',
            'remover_qr_code',
        ]

    def _aplicar_remocao_qr(self, instance, remover_qr_code, novo_qr_code=None):
        if remover_qr_code and instance.qr_code:
            instance.qr_code.delete(save=False)
            instance.qr_code = None

        if novo_qr_code is not None:
            if instance.qr_code and instance.qr_code != novo_qr_code:
                instance.qr_code.delete(save=False)
            instance.qr_code = novo_qr_code

    def create(self, validated_data):
        remover_qr_code = validated_data.pop("remover_qr_code", False)
        novo_qr_code = validated_data.pop("qr_code", None)

        with transaction.atomic():
            dados_pix = DadosPix.objects.create(**validated_data)
            self._aplicar_remocao_qr(dados_pix, remover_qr_code, novo_qr_code)
            dados_pix.save()

        return dados_pix

    def update(self, instance, validated_data):
        remover_qr_code = validated_data.pop("remover_qr_code", False)
        novo_qr_code = validated_data.pop("qr_code", serializers.empty)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        with transaction.atomic():
            if novo_qr_code is not serializers.empty:
                self._aplicar_remocao_qr(instance, remover_qr_code, novo_qr_code)
            elif remover_qr_code:
                self._aplicar_remocao_qr(instance, remover_qr_code)

            instance.save()

        return instance


class GetDadosPixSerializer(serializers.ModelSerializer):
    """
    Serializer para listagem pública de dados Pix.
    """
    qr_code = serializers.SerializerMethodField()

    class Meta:
        model = DadosPix
        fields = [
            'id',
            'chave_pix',
            'qr_code',
            'descricao',
            'banco',
            'agencia',
            'conta',
            'tipo_conta',
            'cnpj',
            'favorecido',
        ]
        read_only_fields = fields

    def get_qr_code(self, obj):
        request = self.context.get('request')
        return _absolute_file_url(request, obj.qr_code)


class OfertaDoacaoCreateSerializer(serializers.ModelSerializer):
    """Serializer público para registrar uma oferta de doação de item."""

    class Meta:
        model = OfertaDoacao
        fields = ["nome_doador", "telefone", "item", "categoria", "quantidade", "observacoes"]

    def validate_nome_doador(self, value):
        if not value.strip():
            raise serializers.ValidationError("Informe o nome do doador.")
        return value.strip()

    def validate_telefone(self, value):
        if not value.strip():
            raise serializers.ValidationError("Informe um telefone para contato.")
        return value.strip()

    def validate_item(self, value):
        if not value.strip():
            raise serializers.ValidationError("Descreva o que deseja doar.")
        return value.strip()


class OfertaDoacaoAdminSerializer(serializers.ModelSerializer):
    """Serializer completo para listagem/gestão das ofertas pelos admins."""

    categoria_display = serializers.CharField(source="get_categoria_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = OfertaDoacao
        fields = [
            "id",
            "nome_doador",
            "telefone",
            "item",
            "categoria",
            "categoria_display",
            "quantidade",
            "observacoes",
            "status",
            "status_display",
            "created_at",
            "updated_at",
        ]


class OfertaDoacaoStatusSerializer(serializers.ModelSerializer):
    """Serializer para o admin atualizar apenas o status da oferta."""

    class Meta:
        model = OfertaDoacao
        fields = ["status"]
