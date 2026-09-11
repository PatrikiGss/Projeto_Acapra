import uuid
from django.db import models
from django.conf import settings

from core.fields import EncryptedTextField


class MetaOAuthState(models.Model):
    state = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='meta_oauth_states',
    )
    user_access_token = EncryptedTextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"OAuthState({self.user_id}, {self.state})"


class MetaConnection(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='meta_connections',
    )
    page_id = models.CharField(max_length=50)
    page_name = models.CharField(max_length=100)
    page_access_token = EncryptedTextField()
    instagram_id = models.CharField(max_length=50, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [('user', 'page_id')]

    def __str__(self):
        return f"{self.page_name} ({self.user})"


class MetaPostLog(models.Model):
    """
    Registro de cada tentativa de publicação nas redes (Facebook/Instagram).

    Antes, uma falha só ia para o log do servidor (erro silencioso, difícil de
    achar no cPanel). Aqui cada tentativa fica gravada e visível no admin, com o
    ID do post (sucesso) ou a mensagem de erro (falha). Guardamos o id/nome do
    animal como texto (não FK) para o log sobreviver à exclusão do animal.
    """

    class Rede(models.TextChoices):
        FACEBOOK = "facebook", "Facebook"
        INSTAGRAM = "instagram", "Instagram"

    animal_id = models.IntegerField(null=True, blank=True)
    animal_nome = models.CharField(max_length=60, blank=True, default="")
    rede = models.CharField(max_length=20, choices=Rede.choices, db_index=True)
    sucesso = models.BooleanField(default=False, db_index=True)
    detalhe = models.TextField(
        blank=True,
        default="",
        help_text="ID do post publicado (sucesso) ou a mensagem de erro (falha).",
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Log de publicação (Meta)"
        verbose_name_plural = "Logs de publicação (Meta)"

    def __str__(self):
        status = "OK" if self.sucesso else "FALHA"
        return f"[{status}] {self.get_rede_display()} — {self.animal_nome}"
