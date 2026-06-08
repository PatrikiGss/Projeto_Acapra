from django.contrib import admin
from .models import Denuncia


@admin.register(Denuncia)
class DenunciaAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "Titulo",
        "Gravidade",
        "nome",
        "telefone"
    )

    list_filter = (
        "Gravidade",
    )

    search_fields = (
        "Titulo",
        "nome"
    )