from django.contrib import admin
from .models import LarVoluntario


@admin.register(LarVoluntario)
class LarVoluntarioAdmin(admin.ModelAdmin):
    list_display = ['nome_responsavel', 'cidade', 'telefone', 'tipos_animais', 'capacidade', 'ativo', 'created_at']
    list_filter = ['ativo', 'tipos_animais', 'cidade', 'created_at']
    search_fields = ['nome_responsavel', 'telefone', 'email', 'cidade', 'descricao']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        ('Responsável', {
            'fields': ('nome_responsavel', 'telefone', 'email')
        }),
        ('Lar', {
            'fields': ('cidade', 'tipos_animais', 'capacidade', 'descricao')
        }),
        ('Status', {
            'fields': ('ativo',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
