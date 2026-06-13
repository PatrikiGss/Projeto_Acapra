from django.conf import settings
from django.db import models


class RegistroAuditoria(models.Model):
    """
    Trilha de auditoria IMUTÁVEL.

    Registra apenas eventos sensíveis (criação/edição/exclusão de dados
    importantes) com o mínimo necessário para auditar: o quê, quem, quando.
    Não é editável nem excluível por ninguém (nem via admin), e é mantida
    enxuta de propósito — só os módulos importantes a alimentam.
    """

    class Acao(models.TextChoices):
        CRIADO = "criado", "Criado"
        EDITADO = "editado", "Editado"
        EXCLUIDO = "excluido", "Excluído"

    # O quê
    acao = models.CharField(max_length=10, choices=Acao.choices)
    modelo = models.CharField(max_length=100, help_text="Entidade afetada (ex.: DadosPix)")
    objeto_id = models.CharField(max_length=64, blank=True, help_text="PK do registro afetado")
    descricao = models.CharField(max_length=255, blank=True, help_text="Resumo legível do registro")
    # Detalhe leve do que mudou (ex.: nomes de campos ou de/para). Opcional.
    alteracoes = models.JSONField(null=True, blank=True)

    # Quem (FK para rastrear + snapshot do e-mail, que sobrevive à exclusão do usuário)
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="acoes_auditoria",
    )
    usuario_email = models.CharField(max_length=254, blank=True)

    # Quando (data + horário no mesmo campo)
    data_hora = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Registro de auditoria"
        verbose_name_plural = "Registros de auditoria"
        ordering = ["-data_hora"]
        indexes = [
            models.Index(fields=["modelo", "objeto_id"]),
            models.Index(fields=["-data_hora"]),
        ]

    def save(self, *args, **kwargs):
        # Imutável: permite apenas a criação (insert), nunca atualização.
        if self.pk is not None:
            raise ValueError(
                "Registros de auditoria são imutáveis e não podem ser alterados."
            )
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValueError(
            "Registros de auditoria são imutáveis e não podem ser excluídos."
        )

    def __str__(self):
        quem = self.usuario_email or "sistema"
        return f"[{self.data_hora:%d/%m/%Y %H:%M}] {self.get_acao_display()} {self.modelo} por {quem}"
