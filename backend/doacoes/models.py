from django.db import models


class DoacaoItem(models.Model):
    nome = models.CharField(max_length=100, help_text="Nome do doador")
    telefone = models.CharField(max_length=20, help_text="Telefone de contato")
    email = models.EmailField(
        blank=True,
        null=True,
        help_text="E-mail de contato (opcional)",
    )
    descricao = models.TextField(
        max_length=1000,
        help_text="Descrição do item ou serviço a ser doado",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Doação de Item"
        verbose_name_plural = "Doações de Itens"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.nome} — {self.created_at:%d/%m/%Y}"


class DadosPix(models.Model):
    """
    Modelo para armazenar os dados de doacao da organizacao.
    Inclui chave Pix, imagem do QR Code e dados bancarios.
    """

    chave_pix = models.CharField(
        max_length=255,
        unique=True,
        help_text="Chave Pix (CPF, CNPJ, email, telefone ou chave aleatoria)"
    )

    qr_code = models.ImageField(
        upload_to='qr_codes/',
        blank=True,
        null=True,
        help_text="Imagem do QR Code para leitura"
    )

    descricao = models.TextField(
        blank=True,
        null=True,
        help_text="Descricao opcional sobre a doacao"
    )

    banco = models.CharField(
        max_length=80,
        blank=True,
        null=True,
        help_text="Nome do banco para transferencia"
    )

    agencia = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        help_text="Agencia bancaria"
    )

    conta = models.CharField(
        max_length=30,
        blank=True,
        null=True,
        help_text="Conta bancaria"
    )

    tipo_conta = models.CharField(
        max_length=40,
        blank=True,
        null=True,
        help_text="Tipo de conta"
    )

    cnpj = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        help_text="CNPJ do favorecido"
    )

    favorecido = models.CharField(
        max_length=120,
        blank=True,
        null=True,
        help_text="Nome do favorecido"
    )

    ativo = models.BooleanField(
        default=True,
        help_text="Define se este dado de doacao esta ativo"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Dados Pix"
        verbose_name_plural = "Dados Pix"

    def __str__(self):
        return f"Pix: {self.chave_pix}"
