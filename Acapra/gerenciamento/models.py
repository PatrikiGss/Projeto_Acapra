from django.db import models
from django.contrib.auth.models import User, Group, Permission

class PerfilAdministrativo(models.Model):
    """
    O Django já possui:
    - login
    - senha
    - email
    - groups
    - permissions
    - superuser
    """
    user=models.OneToOneField(User,on_delete=models.CASCADE,related_name="perfil_admin",verbose_name="Usuario")
    cargo=models.CharField(max_length=50,blank=True,null=True,verbose_name="cargo")
    setor=models.CharField(max_length=50,blank=True,null=True,verbose_name="setor")
    ativo=models.BooleanField(default=True,verbose_name="adminstrador ativo")
    data_promoção=models.DateTimeField(auto_now_add=True,verbose_name="data de promoção")
    promovido_por=models.ForeignKey(User,on_delete=models.SET_NULL,null=True,blank=True,related_name="admins_promovidos",verbose_name="promovidor por")
    observacoes=models.TextField(blank=True,null=True,verbose_name="observações internas")
    class Meta:
        verbose_name = "Perfil Administrativo"
        verbose_name_plural = "Perfis Administrativos"

        Permission[
            ("pode_validar_denuncia", "Pode validar denúncia"),
            ("pode_publicar_denuncia", "Pode publicar denúncia"),
            ("pode_promover_usuario", "Pode promover usuário"),
            ("pode_rebaixar_admin", "Pode rebaixar admin"),
            ("pode_alterar_permissionamento", "Pode alterar permissionamento"),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.cargo or 'sem cargo'}"
    