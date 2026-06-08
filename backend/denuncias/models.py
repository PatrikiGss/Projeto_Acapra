from django.db import models
from phonenumber_field.modelfields import PhoneNumberField


class GravidadeDenuncia(models.TextChoices):
    BAIXO = "baixo", "Baixo"
    MEDIO = "medio", "Médio"
    ALTA = "alta", "Alta"
    URGENTE = "urgente", "Urgente"


class StatusDenuncia(models.TextChoices):
    PENDENTE = "pendente", "Pendente"
    EM_ANALISE = "em_analise", "Em análise"
    RESOLVIDA = "resolvida", "Resolvida"


class Denuncia(models.Model):
    titulo = models.CharField(max_length=100, help_text="Título da denúncia")
    descricao = models.TextField(help_text="Descrição detalhada da ocorrência")
    gravidade = models.CharField(
        max_length=20,
        choices=GravidadeDenuncia.choices,
        help_text="Nível de urgência",
    )
    nome = models.CharField(max_length=100, blank=True, help_text="Nome do denunciante (opcional)")
    telefone = PhoneNumberField(blank=True, null=True, help_text="Telefone para contato (opcional)")
    foto = models.ImageField(
        upload_to="fotos/%Y/%m/%d",
        blank=True,
        null=True,
        help_text="Foto da ocorrência (opcional)",
    )
    status = models.CharField(
        max_length=20,
        choices=StatusDenuncia.choices,
        default=StatusDenuncia.PENDENTE,
        help_text="Status de análise da denúncia",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Denúncia"
        verbose_name_plural = "Denúncias"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.titulo} ({self.get_gravidade_display()})"


