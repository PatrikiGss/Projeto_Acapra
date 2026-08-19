from django.contrib import admin

from .models import PedidoCastracao


@admin.register(PedidoCastracao)
class PedidoCastracaoAdmin(admin.ModelAdmin):
    list_display = ['nome', 'tipo_animal', 'sexo', 'telefone', 'status', 'created_at']
    list_filter = ['tipo_animal', 'sexo', 'status', 'created_at']
    search_fields = ['nome', 'telefone', 'email', 'observacoes']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        ('Contato', {
            'fields': ('nome', 'telefone', 'email')
        }),
        ('Animal', {
            'fields': ('tipo_animal', 'sexo', 'observacoes')
        }),
        ('Andamento', {
            'fields': ('status',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
