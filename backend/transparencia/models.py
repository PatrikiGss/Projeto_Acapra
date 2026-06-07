from django.db import models


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
        upload_to="transparencia/%Y/%m/%d",
        blank=True,
        null=True,
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
        upload_to="transparencia/documentos/%Y/%m/%d",
        blank=True,
        null=True,
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
