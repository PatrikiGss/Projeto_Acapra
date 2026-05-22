from django.db import models


class DadosPix(models.Model):
    """
    Modelo para armazenar os dados de Pix da organização.
    Inclui a chave Pix e a URL/caminho do QR Code.
    """
    chave_pix = models.CharField(
        max_length=255,
        unique=True,
        help_text="Chave Pix (CPF, CNPJ, email, telefone ou chave aleatória)"
    )
    
    qr_code = models.ImageField(
        upload_to='qr_codes/',
        help_text="Imagem do QR Code para leitura"
    )
    
    descricao = models.TextField(
        blank=True,
        null=True,
        help_text="Descrição opcional sobre a doação"
    )
    
    ativo = models.BooleanField(
        default=True,
        help_text="Define se este dado de Pix está ativo"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Dados Pix"
        verbose_name_plural = "Dados Pix"
    
    def __str__(self):
        return f"Pix: {self.chave_pix}"
