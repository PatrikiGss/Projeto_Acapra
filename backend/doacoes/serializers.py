from django.db import transaction
from rest_framework import serializers

from .models import DadosPix, DoacaoItem


class DoacaoItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = DoacaoItem
        fields = ['nome', 'telefone', 'email', 'descricao']

    def validate_telefone(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Informe um número de telefone válido.")
        return value

    def validate_descricao(self, value):
        value = value.strip()
        if len(value) < 10:
            raise serializers.ValidationError("A descrição deve ter ao menos 10 caracteres.")
        return value


class GetDoacaoItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = DoacaoItem
        fields = ['id', 'nome', 'telefone', 'email', 'descricao', 'created_at']
        read_only_fields = fields


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
