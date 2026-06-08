# Generated manually - refactor Denuncia model fields

import phonenumber_field.modelfields
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("denuncias", "0001_initial"),
    ]

    operations = [
        # Remove old capitalized fields
        migrations.RemoveField(model_name="denuncia", name="Titulo"),
        migrations.RemoveField(model_name="denuncia", name="Resumo"),
        migrations.RemoveField(model_name="denuncia", name="Gravidade"),
        # Add new lowercase fields
        migrations.AddField(
            model_name="denuncia",
            name="titulo",
            field=models.CharField(default="", help_text="Título da denúncia", max_length=100),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="denuncia",
            name="descricao",
            field=models.TextField(default="", help_text="Descrição detalhada da ocorrência"),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="denuncia",
            name="gravidade",
            field=models.CharField(
                choices=[
                    ("baixo", "Baixo"),
                    ("medio", "Médio"),
                    ("alta", "Alta"),
                    ("urgente", "Urgente"),
                ],
                default="baixo",
                help_text="Nível de urgência",
                max_length=20,
            ),
            preserve_default=False,
        ),
        # Update nome field
        migrations.AlterField(
            model_name="denuncia",
            name="nome",
            field=models.CharField(
                blank=True,
                help_text="Nome do denunciante (opcional)",
                max_length=100,
            ),
        ),
        # Update telefone field
        migrations.AlterField(
            model_name="denuncia",
            name="telefone",
            field=phonenumber_field.modelfields.PhoneNumberField(
                help_text="Telefone para contato",
                max_length=128,
                region=None,
            ),
        ),
        # Update foto field
        migrations.AlterField(
            model_name="denuncia",
            name="foto",
            field=models.ImageField(
                blank=True,
                help_text="Foto da ocorrência (opcional)",
                null=True,
                upload_to="fotos/%Y/%m/%d",
            ),
        ),
        # Add status field
        migrations.AddField(
            model_name="denuncia",
            name="status",
            field=models.CharField(
                choices=[
                    ("pendente", "Pendente"),
                    ("em_analise", "Em análise"),
                    ("resolvida", "Resolvida"),
                ],
                default="pendente",
                help_text="Status de análise da denúncia",
                max_length=20,
            ),
        ),
        # Add timestamps
        migrations.AddField(
            model_name="denuncia",
            name="created_at",
            field=models.DateTimeField(auto_now_add=True, null=True),
        ),
        migrations.AddField(
            model_name="denuncia",
            name="updated_at",
            field=models.DateTimeField(auto_now=True),
        ),
    ]
