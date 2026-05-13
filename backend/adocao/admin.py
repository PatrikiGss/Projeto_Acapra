from django.contrib import admin
from .models import Animal
@admin.register(Animal)
class AnimalAdmin(admin.ModelAdmin):
    list_display = ("id", "nome_doador", "especie", "sexo")
    list_filter = ("especie", "sexo")
    search_fields = ("nome_doador",)
