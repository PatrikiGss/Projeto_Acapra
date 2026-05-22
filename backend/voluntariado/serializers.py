from rest_framework import serializers
from .models import Voluntario


class VoluntarioSerializer(serializers.ModelSerializer):
    """
    Serializer para criar/atualizar voluntários.
    """
    class Meta:
        model = Voluntario
        fields = ['id', 'nome', 'telefone', 'idade', 'motivo', 'email', 'ativo']
        read_only_fields = ['id', 'ativo']


class GetVoluntarioSerializer(serializers.ModelSerializer):
    """
    Serializer para listagem de voluntários (uso administrativo).
    """
    class Meta:
        model = Voluntario
        fields = ['id', 'nome', 'telefone', 'idade', 'motivo', 'email', 'created_at']
        read_only_fields = ['id', 'created_at']


class CreateVoluntarioSerializer(serializers.ModelSerializer):
    """
    Serializer para criação pública de voluntários.
    """
    class Meta:
        model = Voluntario
        fields = ['nome', 'telefone', 'idade', 'motivo', 'email']
    
    def validate_idade(self, value):
        """
        Valida se a idade é um valor positivo.
        """
        if value < 0 or value > 150:
            raise serializers.ValidationError("A idade deve estar entre 0 e 150 anos.")
        return value
    
    def validate_motivo(self, value):
        """
        Valida se o motivo tem pelo menos 10 caracteres.
        """
        if len(value) < 10:
            raise serializers.ValidationError("O motivo deve ter pelo menos 10 caracteres.")
        return value
