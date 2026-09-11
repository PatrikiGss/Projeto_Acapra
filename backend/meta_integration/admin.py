from django.contrib import admin
from .models import MetaConnection, MetaOAuthState, MetaPostLog


@admin.register(MetaConnection)
class MetaConnectionAdmin(admin.ModelAdmin):
    list_display = ('page_name', 'user', 'instagram_id', 'is_active', 'created_at')
    list_filter = ('is_active',)
    readonly_fields = ('created_at', 'updated_at')


@admin.register(MetaOAuthState)
class MetaOAuthStateAdmin(admin.ModelAdmin):
    list_display = ('user', 'state', 'created_at')
    readonly_fields = ('state', 'created_at')


@admin.register(MetaPostLog)
class MetaPostLogAdmin(admin.ModelAdmin):
    list_display = ('created_at', 'rede', 'sucesso', 'animal_nome', 'detalhe_curto')
    list_filter = ('rede', 'sucesso', 'created_at')
    search_fields = ('animal_nome', 'detalhe')
    readonly_fields = ('animal_id', 'animal_nome', 'rede', 'sucesso', 'detalhe', 'created_at')

    @admin.display(description='Detalhe')
    def detalhe_curto(self, obj):
        return (obj.detalhe or '')[:90]

    def has_add_permission(self, request):
        return False
