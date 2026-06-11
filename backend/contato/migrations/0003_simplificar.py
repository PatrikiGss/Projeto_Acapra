from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('contato', '0002_whatsapp_redes'),
    ]

    operations = [
        migrations.RemoveField(model_name='contatoacapra', name='telefone_castracoes'),
        migrations.RemoveField(model_name='contatoacapra', name='telefone_doacoes'),
        migrations.RemoveField(model_name='contatoacapra', name='telefone_financeiro'),
        migrations.RemoveField(model_name='contatoacapra', name='endereco'),
    ]
