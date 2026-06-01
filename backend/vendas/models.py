from django.db import models


class TipoVestuario(models.TextChoices):
    HUMANO = 'humano', 'Vestuário Humano'
    PET = 'pet', 'Vestuário para Pet'


class Produto(models.Model):
    """
    Modelo para armazenar produtos de vestuário.
    Pode ser vestuário humano ou para pets.
    """
    nome = models.CharField(max_length=200)
    
    descricao = models.TextField(
        blank=True,
        null=True,
        help_text="Descrição detalhada do produto"
    )
    
    tipo = models.CharField(
        max_length=10,
        choices=TipoVestuario.choices,
        help_text="Tipo de vestuário"
    )
    
    preco = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Preço do produto"
    )
    
    foto = models.ImageField(
        upload_to='produtos/%Y/%m/%d',
        blank=True,
        null=True,
        help_text="Foto do produto"
    )
    
    estoque = models.IntegerField(
        default=0,
        help_text="Quantidade em estoque"
    )
    
    ativo = models.BooleanField(
        default=True,
        help_text="Define se o produto está disponível para venda"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Produto"
        verbose_name_plural = "Produtos"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.nome} ({self.get_tipo_display()})"
