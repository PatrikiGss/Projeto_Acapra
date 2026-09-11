import logging
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Animal

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Animal)
def on_animal_created(sender, instance, created, **kwargs):
    if not created:
        return

    try:
        from meta_integration.services import auto_post_animal
        auto_post_animal(instance)
    except Exception as exc:
        logger.error("Erro ao publicar animal nas redes sociais: %s", exc)
