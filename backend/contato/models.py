from django.db import models
from phonenumber_field.modelfields import PhoneNumberField



class Contato(models.Model):
    telefone1 = PhoneNumberField()
    telefone2 = PhoneNumberField(blank=True, null=True)
    telefone3 = PhoneNumberField(blank=True, null=True)
    
    instagram_user = models.CharField(max_length=30)
    instagram_link = models.URLField()

    facebook_user = models.CharField(max_length=30)
    facebook_link = models.URLField()

    email = models.EmailField()

def __str__(self):
    return self.email
    



