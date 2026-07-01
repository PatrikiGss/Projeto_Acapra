from django.db import models

from core.images import CompressImageOnSaveMixin
from core.uploads import upload_noticias
from core.validators import validate_image_upload


class CategoriaNoticia(models.TextChoices):
    NOTICIAS = "noticias", "Notícias"
    RESGATES = "resgates", "Resgates"
    CAMPANHAS = "campanhas", "Campanhas"
    DESAPARECIDOS = "desaparecidos", "Desaparecidos"


class Publicacao(CompressImageOnSaveMixin, models.Model):
    campos_imagem_comprimir = ("foto",)

    categoria = models.CharField(
        max_length=20,
        choices=CategoriaNoticia.choices,
        db_index=True,
    )
    titulo = models.CharField(max_length=200)
    resumo = models.CharField(max_length=280, blank=True, default="")
    foto = models.ImageField(
        upload_to=upload_noticias,
        validators=[validate_image_upload],
    )
    texto = models.TextField()
    ativo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Publicação"
        verbose_name_plural = "Publicações"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.titulo} ({self.get_categoria_display()})"


class PublicacaoImagem(CompressImageOnSaveMixin, models.Model):
    campos_imagem_comprimir = ("imagem",)

    publicacao = models.ForeignKey(
        Publicacao,
        related_name="imagens",
        on_delete=models.CASCADE,
    )
    imagem = models.ImageField(
        upload_to=upload_noticias,
        validators=[validate_image_upload],
    )
    ordem = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["ordem", "id"]
        verbose_name = "Foto da publicação"
        verbose_name_plural = "Fotos das publicações"

    def __str__(self):
        return f"Foto de {self.publicacao.titulo}"
