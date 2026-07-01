from django.contrib import admin
from .models import DocumentoInstitucional, Indicador


@admin.register(DocumentoInstitucional)
class DocumentoInstitucionalAdmin(admin.ModelAdmin):
    list_display = ["nome", "ativo", "ordem", "created_at"]
    list_filter = ["ativo"]
    search_fields = ["nome", "descricao"]


@admin.register(Indicador)
class IndicadorAdmin(admin.ModelAdmin):
    list_display = ["get_chave_display", "valor", "updated_at"]
