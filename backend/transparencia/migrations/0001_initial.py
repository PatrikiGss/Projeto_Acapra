from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Categoria",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("nome", models.CharField(max_length=100)),
                ("tipo", models.CharField(choices=[("entrada", "Entrada"), ("saida", "Saída")], db_index=True, max_length=10)),
                ("ativo", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "verbose_name": "Categoria",
                "verbose_name_plural": "Categorias",
                "ordering": ["tipo", "nome"],
            },
        ),
        migrations.CreateModel(
            name="Movimento",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("descricao", models.CharField(max_length=300)),
                ("valor", models.DecimalField(decimal_places=2, max_digits=10)),
                ("data", models.DateField()),
                ("comprovante", models.FileField(blank=True, null=True, upload_to="transparencia/%Y/%m/%d")),
                ("ativo", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("categoria", models.ForeignKey(
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name="movimentos",
                    to="transparencia.categoria",
                )),
            ],
            options={
                "verbose_name": "Movimento",
                "verbose_name_plural": "Movimentos",
                "ordering": ["-data", "-created_at"],
            },
        ),
    ]
