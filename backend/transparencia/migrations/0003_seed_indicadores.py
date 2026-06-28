from django.db import migrations


CHAVES = ["animais_resgatados", "castracoes", "adocoes"]


def seed_indicadores(apps, schema_editor):
    """Garante a existência dos 3 indicadores de impacto (valor inicial 0)."""
    Indicador = apps.get_model("transparencia", "Indicador")
    for chave in CHAVES:
        Indicador.objects.get_or_create(chave=chave, defaults={"valor": 0})


def remover_indicadores(apps, schema_editor):
    Indicador = apps.get_model("transparencia", "Indicador")
    Indicador.objects.filter(chave__in=CHAVES).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("transparencia", "0002_remove_movimento_categoria_delete_categoria_and_more"),
    ]

    operations = [
        migrations.RunPython(seed_indicadores, remover_indicadores),
    ]
