from django.contrib import admin

from .models import Publicacao, PublicacaoImagem


class PublicacaoImagemInline(admin.TabularInline):
    model = PublicacaoImagem
    extra = 0


@admin.register(Publicacao)
class PublicacaoAdmin(admin.ModelAdmin):
    list_display = ("titulo", "categoria", "ativo", "created_at")
    list_filter = ("categoria", "ativo")
    search_fields = ("titulo", "texto")
    inlines = [PublicacaoImagemInline]
