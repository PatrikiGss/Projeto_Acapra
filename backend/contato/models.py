from django.db import models


class ContatoAcapra(models.Model):
    whatsapp_castracoes = models.CharField(max_length=20, blank=True)
    whatsapp_doacoes = models.CharField(max_length=20, blank=True)
    whatsapp_financeiro = models.CharField(max_length=20, blank=True)
    instagram = models.URLField(max_length=255, blank=True)
    facebook = models.URLField(max_length=255, blank=True)
    email = models.EmailField(blank=True)
    emaildoacoes = models.EmailField(blank=True)
    emailfinanceiro = models.EmailField(blank=True)


    class Meta:
        verbose_name = 'Contato ACAPRA'

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def get_instance(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj
