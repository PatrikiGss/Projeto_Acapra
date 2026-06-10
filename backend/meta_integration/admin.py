from django.contrib import admin
from .models import MetaConnection, MetaOAuthState


@admin.register(MetaConnection)
class MetaConnectionAdmin(admin.ModelAdmin):
    list_display = ('page_name', 'user', 'instagram_id', 'is_active', 'created_at')
    list_filter = ('is_active',)
    readonly_fields = ('created_at', 'updated_at')


@admin.register(MetaOAuthState)
class MetaOAuthStateAdmin(admin.ModelAdmin):
    list_display = ('user', 'state', 'created_at')
    readonly_fields = ('state', 'created_at')
