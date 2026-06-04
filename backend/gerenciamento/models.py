from django.contrib.auth.models import AbstractUser
from django.contrib.auth.models import BaseUserManager
from phonenumber_field.modelfields import PhoneNumberField
from django.db import models
"""
Pequenos ajustes posteriores

criar signal para auto criar PerfilAdministrativo
index no email
validação de telefone 
"""

class UsuarioManager(BaseUserManager):
    """
    Manager customizado para autenticação via email.
    Substitui o comportamento padrão baseado em username.
    """

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("O email é obrigatório")

        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """
        Criação de superusuário com permissões totais no sistema.
        """
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser precisa de is_staff=True")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser precisa de is_superuser=True")

        return self.create_user(email, password, **extra_fields)


class Usuario(AbstractUser):
    """
    Modelo de usuário customizado usando email como login.
    """

    nome = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    telefone = PhoneNumberField(unique=True, null=False, blank=False)
   #password_changed_at = models.DateTimeField(null=True, blank=True)

    # Remove o username padrão
    username = None

    # Define o email como identificador de login
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    # Define o manager customizado
    objects = UsuarioManager()

    def __str__(self):
        return self.nome


class PerfilAdministrativo(models.Model):
    """
    Perfil que define o nível hierárquico e dados administrativos do usuário.
    """

    class Nivel(models.TextChoices):
        USUARIO = "usuario", "Usuário Comum"
        ADMIN = "admin", "Administrador"
        MASTER = "master", "Administrador Master"

    # Relacionamento 1:1 com usuário
    usuario = models.OneToOneField(
        Usuario,
        on_delete=models.CASCADE,
        related_name="perfil_admin"
    )

    # Define o nível hierárquico do usuário
    nivel = models.CharField(
        max_length=20,
        choices=Nivel.choices,
        default=Nivel.USUARIO
    )

    # Informações administrativas opcionais
    cargo = models.CharField(max_length=100, blank=True, null=True)
    setor = models.CharField(max_length=100, blank=True, null=True)

    # Controle de status
    ativo = models.BooleanField(default=True)

    # Registro de promoção
    data_promocao = models.DateTimeField(auto_now_add=True)

    # Quem promoveu esse usuário
    promovido_por = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="admins_promovidos"
    )

    # Observações internas
    observacoes = models.TextField(blank=True, null=True)

    class Meta:
        """
        Permissões customizadas do Django.
        Usadas em conjunto com o nível para controle de acesso.
        """
        permissions = [
            ("pode_validar_denuncia", "Pode validar denúncia"),
            ("pode_publicar_denuncia", "Pode publicar denúncia"),
            ("pode_promover_usuario", "Pode promover usuário"),
            ("pode_rebaixar_admin", "Pode rebaixar admin"),
            ("pode_alterar_permissionamento", "Pode alterar permissionamento"),
        ]

    def __str__(self):
        return f"{self.usuario.nome} - {self.nivel}"