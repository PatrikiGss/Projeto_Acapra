from django.contrib import admin
from .models import ContatoAcapra


@admin.register(ContatoAcapra)
class ContatoAcapraAdmin(admin.ModelAdmin):
    pass
