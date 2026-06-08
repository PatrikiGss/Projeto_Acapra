from django.contrib import admin
from .models import Categoria, DocumentoInstitucional, Indicador, Movimento


@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ["nome", "tipo", "ativo", "created_at"]
    list_filter = ["tipo", "ativo"]
    search_fields = ["nome"]


@admin.register(Movimento)
class MovimentoAdmin(admin.ModelAdmin):
    list_display = ["descricao", "categoria", "valor", "data", "ativo"]
    list_filter = ["categoria__tipo", "ativo", "data"]
    search_fields = ["descricao", "categoria__nome"]
    date_hierarchy = "data"


@admin.register(DocumentoInstitucional)
class DocumentoInstitucionalAdmin(admin.ModelAdmin):
    list_display = ["nome", "ativo", "ordem", "created_at"]
    list_filter = ["ativo"]
    search_fields = ["nome", "descricao"]


@admin.register(Indicador)
class IndicadorAdmin(admin.ModelAdmin):
    list_display = ["get_chave_display", "valor", "updated_at"]
