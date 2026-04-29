from django.db import models
from django.contrib.auth.models import User


class PerfilAdministrativo(models.Model):
    """
    Model complementar ao User padrão do Django.

    ====================================================
    CAMPOS NATIVOS DO DJANGO (model User)
    ====================================================

    Esses campos JÁ EXISTEM no Django e podem ser usados
    pelo frontend normalmente através do relacionamento `user`.

    Principais campos disponíveis:

    - username -> nome de login do usuário
    - first_name -> primeiro nome
    - last_name -> sobrenome
    - email -> email do usuário
    - password -> senha criptografada
    - is_active -> usuário ativo/inativo
    - is_staff -> acesso ao painel admin
    - is_superuser -> super usuário (acesso total)
    - groups -> grupos de permissão (Usuário, Admin, Admin Master)
    - user_permissions -> permissões específicas
    - last_login -> último login
    - date_joined -> data de criação da conta

    NÃO recriamos esses campos aqui porque o Django já fornece.

    ====================================================
    CAMPOS DESTA MODEL (PerfilAdministrativo)
    ====================================================

    Aqui ficam apenas informações complementares para gestão:

    - cargo
    - setor
    - ativo
    - data_promocao
    - promovido_por
    - observacoes
    """

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="perfil_administrativo",
        verbose_name="Usuário"
    )

    cargo = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Cargo"
    )

    setor = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Setor"
    )

    ativo = models.BooleanField(
        default=True,
        verbose_name="Administrador ativo"
    )

    data_promocao = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Data de promoção"
    )

    promovido_por = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="admins_promovidos",
        verbose_name="Promovido por"
    )

    observacoes = models.TextField(
        blank=True,
        null=True,
        verbose_name="Observações internas"
    )

    class Meta:
        verbose_name = "Perfil Administrativo"
        verbose_name_plural = "Perfis Administrativos"

        permissions = [
            ("pode_validar_denuncia", "Pode validar denúncia"),
            ("pode_publicar_denuncia", "Pode publicar denúncia"),
            ("pode_promover_usuario", "Pode promover usuário"),
            ("pode_rebaixar_admin", "Pode rebaixar admin"),
            ("pode_alterar_permissionamento", "Pode alterar permissionamento"),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.cargo or 'Sem cargo'}"