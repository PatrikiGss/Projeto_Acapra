from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Publicacao",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("categoria", models.CharField(choices=[("noticias", "Notícias"), ("resgates", "Resgates"), ("campanhas", "Campanhas")], db_index=True, max_length=20)),
                ("titulo", models.CharField(max_length=200)),
                ("foto", models.ImageField(upload_to="noticias/%Y/%m/%d")),
                ("texto", models.TextField()),
                ("ativo", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name": "Publicação",
                "verbose_name_plural": "Publicações",
                "ordering": ["-created_at"],
            },
        ),
    ]
