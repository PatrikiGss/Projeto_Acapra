from rest_framework import serializers
from .models import LarVoluntario


class LarVoluntarioSerializer(serializers.ModelSerializer):
    tipos_animais_display = serializers.CharField(source='get_tipos_animais_display', read_only=True)

    class Meta:
        model = LarVoluntario
        fields = ['id', 'nome_responsavel', 'telefone', 'email', 'cidade',
                  'tipos_animais', 'tipos_animais_display', 'capacidade', 'descricao', 'ativo']
        read_only_fields = ['id', 'ativo']


class GetLarVoluntarioSerializer(serializers.ModelSerializer):
    tipos_animais_display = serializers.CharField(source='get_tipos_animais_display', read_only=True)

    class Meta:
        model = LarVoluntario
        fields = ['id', 'nome_responsavel', 'telefone', 'email', 'cidade',
                  'tipos_animais', 'tipos_animais_display', 'capacidade', 'descricao', 'ativo', 'created_at']
        read_only_fields = ['id', 'created_at']


class CreateLarVoluntarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = LarVoluntario
        fields = ['nome_responsavel', 'telefone', 'email', 'cidade',
                  'tipos_animais', 'capacidade', 'descricao']

    def validate_capacidade(self, value):
        if value < 1:
            raise serializers.ValidationError("A capacidade deve ser de pelo menos 1 animal.")
        if value > 50:
            raise serializers.ValidationError("A capacidade não pode ultrapassar 50 animais.")
        return value

    def validate_descricao(self, value):
        if len(value) < 20:
            raise serializers.ValidationError("A descrição deve ter pelo menos 20 caracteres.")
        return value
