# serializers.py

from rest_framework import serializers
from .models import Denuncia


class DenunciaCreateSerializer(serializers.ModelSerializer):
    """Serializer público para criação de denúncias."""

    telefone = serializers.CharField(
        required=False, allow_blank=True, default=""
    )

    class Meta:
        model = Denuncia
        fields = ["titulo", "descricao", "gravidade", "nome", "telefone", "foto"]

    def validate_telefone(self, value):
        if not value:
            return None
        return value


class DenunciaAdminSerializer(serializers.ModelSerializer):
    """Serializer completo para listagem/detalhe por admins."""

    gravidade_display = serializers.CharField(source="get_gravidade_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    foto = serializers.SerializerMethodField()

    def get_foto(self, obj):
        # Caminho relativo (ex.: /media/fotos/x.jpg), como nos demais apps.
        # O ImageField padrao do DRF devolveria URL absoluta no host do site,
        # que em producao nao e roteada para o Django (erro 500); o front monta
        # a URL final a partir do caminho relativo.
        return obj.foto.url if obj.foto else None

    class Meta:
        model = Denuncia
        fields = [
            "id",
            "titulo",
            "descricao",
            "gravidade",
            "gravidade_display",
            "nome",
            "telefone",
            "foto",
            "status",
            "status_display",
            "created_at",
            "updated_at",
        ]


class DenunciaStatusSerializer(serializers.ModelSerializer):
    """Serializer para atualização de status pelo admin."""

    class Meta:
        model = Denuncia
        fields = ["status"]
