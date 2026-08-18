from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("adocao", "0003_animal_created_at"),
    ]

    operations = [
        migrations.AddField(
            model_name="animal",
            name="foto_foco_x",
            field=models.FloatField(default=0.5),
        ),
        migrations.AddField(
            model_name="animal",
            name="foto_foco_y",
            field=models.FloatField(default=0.5),
        ),
    ]