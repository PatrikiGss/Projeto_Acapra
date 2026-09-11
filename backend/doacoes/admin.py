from django.contrib import admin
from .models import DadosPix, OfertaDoacao


@admin.register(DadosPix)
class DadosPixAdmin(admin.ModelAdmin):
    list_display = ['chave_pix', 'banco', 'favorecido', 'ativo', 'created_at']
    list_filter = ['ativo', 'created_at']
    search_fields = ['chave_pix', 'descricao', 'banco', 'favorecido', 'cnpj']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        ('Informacoes do Pix', {
            'fields': ('chave_pix', 'qr_code', 'descricao')
        }),
        ('Dados bancarios', {
            'fields': ('banco', 'agencia', 'conta', 'tipo_conta', 'cnpj', 'favorecido')
        }),
        ('Status', {
            'fields': ('ativo',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(OfertaDoacao)
class OfertaDoacaoAdmin(admin.ModelAdmin):
    list_display = ['item', 'categoria', 'quantidade', 'nome_doador', 'telefone', 'status', 'created_at']
    list_filter = ['status', 'categoria', 'created_at']
    search_fields = ['item', 'nome_doador', 'telefone', 'observacoes']
    list_editable = ['status']
    readonly_fields = ['created_at', 'updated_at']
