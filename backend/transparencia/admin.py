from django.contrib import admin

from django.contrib import admin

from .models import DocumentoTransparencia


@admin.register(DocumentoTransparencia)
class DocumentoTransparenciaAdmin(admin.ModelAdmin):
    list_display = ("titulo", "categoria", "ano", "ativo", "created_at")
    list_filter = ("categoria", "ativo", "ano")
    search_fields = ("titulo", "descricao")
