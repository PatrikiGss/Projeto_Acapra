from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("noticias", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="publicacao",
            name="resumo",
            field=models.CharField(blank=True, default="", max_length=280),
        ),
    ]
