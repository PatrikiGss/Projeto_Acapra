from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("doacoes", "0003_alter_dadospix_ativo_alter_dadospix_chave_pix_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="dadospix",
            name="qr_code",
            field=models.ImageField(blank=True, help_text="Imagem do QR Code para leitura", null=True, upload_to="qr_codes/"),
        ),
    ]
