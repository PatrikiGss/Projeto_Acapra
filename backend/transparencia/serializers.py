from rest_framework import serializers
from .models import Categoria, Movimento


class MovimentoReadSerializer(serializers.ModelSerializer):
    comprovante = serializers.SerializerMethodField()

    class Meta:
        model = Movimento
        fields = ["id", "categoria", "descricao", "valor", "data", "comprovante", "ativo", "created_at"]
        read_only_fields = fields

    def get_comprovante(self, obj):
        if not obj.comprovante:
            return None
        return obj.comprovante.url


class MovimentoWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Movimento
        fields = ["id", "categoria", "descricao", "valor", "data", "comprovante", "ativo"]


class CategoriaReadSerializer(serializers.ModelSerializer):
    tipo_display = serializers.CharField(source="get_tipo_display", read_only=True)
    movimentos = serializers.SerializerMethodField()

    class Meta:
        model = Categoria
        fields = ["id", "nome", "tipo", "tipo_display", "ativo", "movimentos"]
        read_only_fields = fields

    def get_movimentos(self, obj):
        request = self.context.get("request")
        qs = obj.movimentos.all()
        if not request or not request.user.is_authenticated:
            qs = qs.filter(ativo=True)
        return MovimentoReadSerializer(qs, many=True, context=self.context).data


class CategoriaWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ["id", "nome", "tipo", "ativo"]