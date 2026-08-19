from django.db import models
from phonenumber_field.modelfields import PhoneNumberField


class SexoAnimal(models.TextChoices):
    MACHO = "macho", "Macho"
    FEMEA = "femea", "Fêmea"


class TipoAnimal(models.TextChoices):
    CACHORRO = "cachorro", "Cachorro"
    GATO = "gato", "Gato"
    OUTROS = "outros", "Outros"


class StatusCastracao(models.TextChoices):
    PENDENTE = "pendente", "Pendente"
    AGENDADA = "agendada", "Agendada"
    REALIZADA = "realizada", "Realizada"


class PedidoCastracao(models.Model):
    """
    Pedido de castração enviado pelo público.

    Guarda os dados do animal (tipo e sexo) e o contato do responsável.
    A listagem é restrita a administradores (módulo `castracao`).
    """

    nome = models.CharField(
        max_length=200,
        help_text="Nome da pessoa responsável pelo animal"
    )

    telefone = PhoneNumberField(
        help_text="Telefone para contato"
    )

    email = models.EmailField(
        blank=True,
        null=True,
        help_text="Email para contato (opcional)"
    )

    tipo_animal = models.CharField(
        max_length=20,
        choices=TipoAnimal.choices,
        help_text="Tipo do animal: cachorro, gato ou outros"
    )

    sexo = models.CharField(
        max_length=10,
        choices=SexoAnimal.choices,
        help_text="Sexo do animal"
    )

    observacoes = models.TextField(
        blank=True,
        help_text="Informações adicionais sobre o animal (opcional)"
    )

    status = models.CharField(
        max_length=20,
        choices=StatusCastracao.choices,
        default=StatusCastracao.PENDENTE,
        help_text="Andamento do pedido de castração"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Pedido de castração"
        verbose_name_plural = "Pedidos de castração"
        # Desempate por -id garante ordem determinística quando dois registros
        # compartilham o mesmo created_at (criados no mesmo instante).
        ordering = ['-created_at', '-id']

    def __str__(self):
        return f"{self.nome} - {self.get_tipo_animal_display()} ({self.get_sexo_display()})"
