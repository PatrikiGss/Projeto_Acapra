from django.db import models


class CategoriaNoticia(models.TextChoices):
    NOTICIAS = "noticias", "Notícias"
    RESGATES = "resgates", "Resgates"
    CAMPANHAS = "campanhas", "Campanhas"


class Publicacao(models.Model):
    categoria = models.CharField(
        max_length=20,
        choices=CategoriaNoticia.choices,
        db_index=True,
    )
    titulo = models.CharField(max_length=200)
    resumo = models.CharField(max_length=280, blank=True, default="")
    foto = models.ImageField(upload_to="noticias/%Y/%m/%d")
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
