from rest_framework import serializers

from .models import DocumentoTransparencia


def _absolute_file_url(request, file_field):
    if not file_field:
        return None

    return file_field.url


class DocumentoTransparenciaSerializer(serializers.ModelSerializer):
    categoria_display = serializers.CharField(source="get_categoria_display", read_only=True)
    arquivo_pdf_url = serializers.SerializerMethodField()

    class Meta:
        model = DocumentoTransparencia
        fields = [
            "id",
            "titulo",
            "descricao",
            "arquivo_pdf",
            "arquivo_pdf_url",
            "ano",
            "categoria",
            "categoria_display",
            "ativo",
            "created_at",
        ]
        read_only_fields = ["id", "created_at", "categoria_display", "arquivo_pdf_url"]

    def get_arquivo_pdf_url(self, obj):
        request = self.context.get("request")
        return _absolute_file_url(request, obj.arquivo_pdf)
