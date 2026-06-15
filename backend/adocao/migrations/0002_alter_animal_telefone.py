from django.db import migrations
import phonenumber_field.modelfields


class Migration(migrations.Migration):

    dependencies = [
        ('adocao', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='animal',
            name='telefone',
            field=phonenumber_field.modelfields.PhoneNumberField(max_length=128, region=None, unique=False),
        ),
    ]
