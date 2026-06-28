from django.db import models
from phonenumber_field.modelfields import PhoneNumberField

from core.uploads import upload_qr_codes
from core.validators import validate_image_upload


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
        upload_to=upload_qr_codes,
        blank=True,
        null=True,
        help_text="Imagem do QR Code para leitura",
        validators=[validate_image_upload],
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


class CategoriaItemDoacao(models.TextChoices):
    ALIMENTO = "alimento", "Alimento / Ração"
    VESTUARIO = "vestuario", "Roupa / Cobertor"
    HIGIENE = "higiene", "Higiene / Limpeza"
    MEDICAMENTO = "medicamento", "Medicamento"
    ACESSORIO = "acessorio", "Acessório / Brinquedo"
    OUTROS = "outros", "Outros"


class StatusOfertaDoacao(models.TextChoices):
    PENDENTE = "pendente", "Pendente"
    EM_CONTATO = "em_contato", "Em contato"
    RECEBIDA = "recebida", "Recebida"


class OfertaDoacao(models.Model):
    """
    Oferta de doação de itens enviada pelo público (ração, roupa, etc.).

    Diferente de DadosPix (doação financeira da ONG), aqui qualquer pessoa
    registra algo que gostaria de doar para a ACAPRA entrar em contato.
    """

    nome_doador = models.CharField(max_length=120, help_text="Nome de quem vai doar")
    telefone = PhoneNumberField(help_text="Telefone/WhatsApp para contato")
    item = models.CharField(max_length=200, help_text="O que deseja doar (ex.: ração, roupa para cães)")
    categoria = models.CharField(
        max_length=20,
        choices=CategoriaItemDoacao.choices,
        default=CategoriaItemDoacao.OUTROS,
        help_text="Categoria do item",
    )
    quantidade = models.CharField(
        max_length=60,
        blank=True,
        default="",
        help_text="Quantidade aproximada (ex.: 3 sacos, 5 peças, 2 kg)",
    )
    observacoes = models.TextField(
        blank=True,
        default="",
        help_text="Detalhes adicionais (estado do item, melhor horário, etc.)",
    )
    status = models.CharField(
        max_length=20,
        choices=StatusOfertaDoacao.choices,
        default=StatusOfertaDoacao.PENDENTE,
        help_text="Andamento do contato com o doador",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Oferta de doação"
        verbose_name_plural = "Ofertas de doação"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.item} — {self.nome_doador}"
