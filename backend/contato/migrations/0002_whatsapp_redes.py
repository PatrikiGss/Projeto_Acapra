from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('contato', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='contatoacapra',
            name='whatsapp_castracoes',
            field=models.CharField(blank=True, max_length=20),
        ),
        migrations.AddField(
            model_name='contatoacapra',
            name='whatsapp_doacoes',
            field=models.CharField(blank=True, max_length=20),
        ),
        migrations.AddField(
            model_name='contatoacapra',
            name='whatsapp_financeiro',
            field=models.CharField(blank=True, max_length=20),
        ),
        migrations.AlterField(
            model_name='contatoacapra',
            name='instagram',
            field=models.URLField(blank=True, max_length=255),
        ),
        migrations.AlterField(
            model_name='contatoacapra',
            name='facebook',
            field=models.URLField(blank=True, max_length=255),
        ),
    ]
