from django.db import models


class CategoriaDocumento(models.TextChoices):
    BALANCETE = "balancete", "Balancete"
    ATA = "ata", "Ata"
    RELATORIO = "relatorio", "Relatorio"
    OUTRO = "outro", "Outro"


class DocumentoTransparencia(models.Model):
    titulo = models.CharField(max_length=200)
    descricao = models.TextField(blank=True, default="")
    arquivo_pdf = models.FileField(upload_to="transparencia/%Y/%m/%d")
    ano = models.PositiveIntegerField(db_index=True)
    categoria = models.CharField(
        max_length=20,
        choices=CategoriaDocumento.choices,
        db_index=True,
    )
    ativo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-ano", "-created_at", "-id"]
        verbose_name = "Documento de transparência"
        verbose_name_plural = "Documentos de transparência"

    def __str__(self):
        return f"{self.titulo} ({self.ano})"
