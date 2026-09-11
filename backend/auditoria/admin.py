from django.contrib import admin

from .models import RegistroAuditoria


@admin.register(RegistroAuditoria)
class RegistroAuditoriaAdmin(admin.ModelAdmin):
    """Trilha de auditoria — somente leitura, inclusive para superusuários."""

    list_display = ("data_hora", "acao", "modelo", "objeto_id", "usuario_email")
    list_filter = ("acao", "modelo")
    search_fields = ("modelo", "objeto_id", "usuario_email", "descricao")
    readonly_fields = [field.name for field in RegistroAuditoria._meta.fields]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
