from django.contrib import admin
from .models import Voluntario


@admin.register(Voluntario)
class VoluntarioAdmin(admin.ModelAdmin):
    list_display = ['nome', 'idade', 'telefone', 'ativo', 'created_at']
    list_filter = ['ativo', 'created_at', 'idade']
    search_fields = ['nome', 'telefone', 'email', 'motivo']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        ('Informações Pessoais', {
            'fields': ('nome', 'idade', 'telefone', 'email')
        }),
        ('Motivação', {
            'fields': ('motivo',)
        }),
        ('Status', {
            'fields': ('ativo',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
