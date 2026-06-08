from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("noticias", "0002_publicacao_resumo"),
    ]

    operations = [
        migrations.AlterField(
            model_name="publicacao",
            name="categoria",
            field=models.CharField(
                choices=[
                    ("noticias", "Notícias"),
                    ("resgates", "Resgates"),
                    ("campanhas", "Campanhas"),
                    ("desaparecidos", "Desaparecidos"),
                ],
                db_index=True,
                max_length=20,
            ),
        ),
    ]
