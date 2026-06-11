from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='ContatoAcapra',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('telefone_castracoes', models.CharField(blank=True, max_length=20)),
                ('telefone_doacoes', models.CharField(blank=True, max_length=20)),
                ('telefone_financeiro', models.CharField(blank=True, max_length=20)),
                ('instagram', models.CharField(blank=True, max_length=150)),
                ('facebook', models.CharField(blank=True, max_length=150)),
                ('email', models.EmailField(blank=True, max_length=254)),
                ('endereco', models.CharField(blank=True, max_length=255)),
            ],
            options={
                'verbose_name': 'Contato ACAPRA',
            },
        ),
    ]
