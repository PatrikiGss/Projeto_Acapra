from rest_framework import serializers

from .models import RegistroAuditoria


class RegistroAuditoriaSerializer(serializers.ModelSerializer):
    acao_display = serializers.CharField(source="get_acao_display", read_only=True)
    usuario_nome = serializers.CharField(source="usuario.nome", read_only=True, default=None)

    class Meta:
        model = RegistroAuditoria
        fields = [
            "id",
            "acao",
            "acao_display",
            "modelo",
            "objeto_id",
            "descricao",
            "alteracoes",
            "usuario",
            "usuario_nome",
            "usuario_email",
            "data_hora",
        ]
        read_only_fields = fields
