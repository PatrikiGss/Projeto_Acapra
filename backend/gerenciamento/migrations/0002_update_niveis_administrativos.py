from django.db import migrations, models


def migrar_nivel_admin(apps, schema_editor):
    PerfilAdministrativo = apps.get_model("gerenciamento", "PerfilAdministrativo")
    PerfilAdministrativo.objects.filter(nivel="admin").update(nivel="master")


class Migration(migrations.Migration):

    dependencies = [
        ("gerenciamento", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(migrar_nivel_admin, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="perfiladministrativo",
            name="nivel",
            field=models.CharField(
                choices=[
                    ("usuario", "Usuário sem vínculo"),
                    ("doacoes", "Doações"),
                    ("financeiro", "Financeiro"),
                    ("master", "Diretor Acapra"),
                ],
                default="usuario",
                max_length=20,
            ),
        ),
    ]
