from rest_framework import serializers

from .models import Publicacao


def _absolute_file_url(request, file_field):
    if not file_field:
        return None

    url = file_field.url
    if request is None:
        return url

    return request.build_absolute_uri(url)


class PublicacaoWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Publicacao
        fields = ["id", "categoria", "titulo", "resumo", "foto", "texto", "ativo"]


class GetPublicacaoSerializer(serializers.ModelSerializer):
    categoria_display = serializers.CharField(source="get_categoria_display", read_only=True)
    foto = serializers.SerializerMethodField()

    class Meta:
        model = Publicacao
        fields = [
            "id",
            "categoria",
            "categoria_display",
            "titulo",
            "resumo",
            "foto",
            "texto",
            "ativo",
            "created_at",
        ]
        read_only_fields = fields

    def get_foto(self, obj):
        request = self.context.get("request")
        return _absolute_file_url(request, obj.foto)
