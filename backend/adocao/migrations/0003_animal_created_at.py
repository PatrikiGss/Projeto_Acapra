# Generated manually to backfill timestamps for existing animals.

from django.db import migrations, models
from django.utils import timezone


def preencher_created_at(apps, schema_editor):
    Animal = apps.get_model("adocao", "Animal")
    Animal.objects.filter(created_at__isnull=True).update(created_at=timezone.now())


class Migration(migrations.Migration):

    dependencies = [
        ("adocao", "0002_alter_animal_sexo"),
    ]

    operations = [
        migrations.AddField(
            model_name="animal",
            name="created_at",
            field=models.DateTimeField(blank=True, db_index=True, null=True),
        ),
        migrations.RunPython(preencher_created_at, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="animal",
            name="created_at",
            field=models.DateTimeField(auto_now_add=True, db_index=True),
        ),
    ]
