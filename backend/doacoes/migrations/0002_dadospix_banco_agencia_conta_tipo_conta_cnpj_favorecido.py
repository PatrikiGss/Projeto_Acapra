from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("doacoes", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="dadospix",
            name="banco",
            field=models.CharField(blank=True, help_text="Nome do banco para transferencia", max_length=80, null=True),
        ),
        migrations.AddField(
            model_name="dadospix",
            name="agencia",
            field=models.CharField(blank=True, help_text="Agencia bancaria", max_length=20, null=True),
        ),
        migrations.AddField(
            model_name="dadospix",
            name="conta",
            field=models.CharField(blank=True, help_text="Conta bancaria", max_length=30, null=True),
        ),
        migrations.AddField(
            model_name="dadospix",
            name="tipo_conta",
            field=models.CharField(blank=True, help_text="Tipo de conta", max_length=40, null=True),
        ),
        migrations.AddField(
            model_name="dadospix",
            name="cnpj",
            field=models.CharField(blank=True, help_text="CNPJ do favorecido", max_length=20, null=True),
        ),
        migrations.AddField(
            model_name="dadospix",
            name="favorecido",
            field=models.CharField(blank=True, help_text="Nome do favorecido", max_length=120, null=True),
        ),
    ]
