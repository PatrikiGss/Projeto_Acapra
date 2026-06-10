from django.contrib import admin
from .models import Denuncia


@admin.register(Denuncia)
class DenunciaAdmin(admin.ModelAdmin):
    list_display = ("id", "titulo", "gravidade", "status", "nome", "telefone", "created_at")
    list_filter = ("gravidade", "status")
    search_fields = ("titulo", "nome")
    readonly_fields = ("created_at", "updated_at")
