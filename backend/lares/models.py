from django.db import models
from phonenumber_field.modelfields import PhoneNumberField


TIPO_ANIMAL_CHOICES = [
    ('todos', 'Todos'),
    ('caes', 'Cães'),
    ('gatos', 'Gatos'),
    ('caes_gatos', 'Cães e Gatos'),
]


class LarVoluntario(models.Model):
    nome_responsavel = models.CharField(
        max_length=200,
        help_text="Nome completo do responsável pelo lar"
    )

    telefone = PhoneNumberField(
        help_text="Telefone para contato"
    )

    email = models.EmailField(
        blank=True,
        null=True,
        help_text="Email para contato (opcional)"
    )

    cidade = models.CharField(
        max_length=100,
        help_text="Cidade onde o lar está localizado"
    )

    tipos_animais = models.CharField(
        max_length=20,
        choices=TIPO_ANIMAL_CHOICES,
        default='todos',
        help_text="Tipos de animais aceitos no lar"
    )

    capacidade = models.PositiveIntegerField(
        help_text="Quantidade máxima de animais que pode acolher simultaneamente"
    )

    descricao = models.TextField(
        help_text="Descreva o ambiente, espaço disponível e experiência com animais"
    )

    ativo = models.BooleanField(
        default=True,
        help_text="Define se o lar está disponível para acolhimento"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Lar Voluntário"
        verbose_name_plural = "Lares Voluntários"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.nome_responsavel} — {self.cidade}"
