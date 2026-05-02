from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Usuario, PerfilAdministrativo

@receiver(post_save, sender=Usuario)
def criar_perfil_admin(sender, instance, created, **kwargs):
    if created:
        PerfilAdministrativo.objects.create(usuario=instance)