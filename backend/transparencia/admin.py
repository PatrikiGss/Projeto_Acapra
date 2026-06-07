from django.contrib import admin
from .models import Categoria, Movimento


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
