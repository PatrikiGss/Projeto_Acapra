from django.db import models

from core.uploads import upload_transparencia, upload_transparencia_documentos
from core.validators import validate_document_upload


class TipoMovimento(models.TextChoices):
    ENTRADA = "entrada", "Entrada"
    SAIDA = "saida", "Saída"


class Categoria(models.Model):
    nome = models.CharField(max_length=100)
    tipo = models.CharField(max_length=10, choices=TipoMovimento.choices, db_index=True)
    ativo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Categoria"
        verbose_name_plural = "Categorias"
        ordering = ["tipo", "nome"]

    def __str__(self):
        return f"{self.get_tipo_display()} — {self.nome}"


class Movimento(models.Model):
    categoria = models.ForeignKey(
        Categoria,
        on_delete=models.PROTECT,
        related_name="movimentos",
    )
    descricao = models.CharField(max_length=300)
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    data = models.DateField()
    comprovante = models.FileField(
        upload_to=upload_transparencia,
        blank=True,
        null=True,
        validators=[validate_document_upload],
    )
    ativo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Movimento"
        verbose_name_plural = "Movimentos"
        ordering = ["-data", "-created_at"]

    def __str__(self):
        return f"{self.categoria} | {self.descricao} (R$ {self.valor})"


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
