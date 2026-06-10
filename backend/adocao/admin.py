from django.contrib import admin
from .models import Animal, AnimalImagem


class AnimalImagemInline(admin.TabularInline):
    model = AnimalImagem
    extra = 1


@admin.register(Animal)
class AnimalAdmin(admin.ModelAdmin):
    inlines = [AnimalImagemInline]
    list_display = ("id", "nome_doador", "especie", "sexo")
    list_filter = ("especie", "sexo")
    search_fields = ("nome_doador",)
