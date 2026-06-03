from django.contrib import admin
from .models import Animal

@admin.register(Animal)
class AnimalAdmin(admin.ModelAdmin):
    list_display = ('nome', 'especie', 'status', 'data_criacao')
    list_filter = ('status', 'especie')
    search_fields = ('nome', 'raca')