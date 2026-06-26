from django.db import models

from core.uploads import upload_transparencia_documentos
from core.validators import validate_document_upload


class DocumentoInstitucional(models.Model):
    nome = models.CharField(max_length=200)
    descricao = models.CharField(max_length=300, blank=True, default="")
    arquivo = models.FileField(
        upload_to=upload_transparencia_documentos,
        blank=True,
        null=True,
        validators=[validate_document_upload],
    )
    ativo = models.BooleanField(default=True)
    ordem = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Documento Institucional"
        verbose_name_plural = "Documentos Institucionais"
        ordering = ["ordem", "nome"]

    def __str__(self):
        return self.nome


class Indicador(models.Model):
    class Chave(models.TextChoices):
        ANIMAIS = "animais_resgatados", "Animais resgatados"
        CASTRACOES = "castracoes", "Castrações realizadas"
        ADOCOES = "adocoes", "Adoções bem-sucedidas"

    chave = models.CharField(max_length=30, choices=Chave.choices, unique=True)
    valor = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Indicador de impacto"
        verbose_name_plural = "Indicadores de impacto"
        ordering = ["chave"]

    def __str__(self):
        return f"{self.get_chave_display()}: {self.valor}"
