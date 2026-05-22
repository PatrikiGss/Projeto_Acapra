from django.contrib import admin
from .models import Produto


@admin.register(Produto)
class ProdutoAdmin(admin.ModelAdmin):
    list_display = ['nome', 'tipo', 'preco', 'estoque', 'ativo', 'created_at']
    list_filter = ['tipo', 'ativo', 'created_at']
    search_fields = ['nome', 'descricao']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        ('Informacoes do Produto', {
            'fields': ('nome', 'descricao', 'tipo')
        }),
        ('Preco e Estoque', {
            'fields': ('preco', 'estoque')
        }),
        ('Midia', {
            'fields': ('foto',)
        }),
        ('Status', {
            'fields': ('ativo',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
