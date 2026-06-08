from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("transparencia", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="DocumentoInstitucional",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("nome", models.CharField(max_length=200)),
                ("descricao", models.CharField(blank=True, default="", max_length=300)),
                ("arquivo", models.FileField(blank=True, null=True, upload_to="transparencia/documentos/%Y/%m/%d")),
                ("ativo", models.BooleanField(default=True)),
                ("ordem", models.PositiveSmallIntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name": "Documento Institucional",
                "verbose_name_plural": "Documentos Institucionais",
                "ordering": ["ordem", "nome"],
            },
        ),
    ]
