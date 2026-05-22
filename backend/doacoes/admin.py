from django.contrib import admin
from .models import DadosPix


@admin.register(DadosPix)
class DadosPixAdmin(admin.ModelAdmin):
    list_display = ['chave_pix', 'ativo', 'created_at']
    list_filter = ['ativo', 'created_at']
    search_fields = ['chave_pix', 'descricao']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        ('Informações do Pix', {
            'fields': ('chave_pix', 'qr_code', 'descricao')
        }),
        ('Status', {
            'fields': ('ativo',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
