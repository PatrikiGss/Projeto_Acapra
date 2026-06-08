from django.db import models
from phonenumber_field.modelfields import PhoneNumberField

class GravidadeDenuncia(models.TextChoices):
    baixo = 'baixo', 'Baixo'
    medio = 'medio', 'Medio'
    alta = 'alta', 'Alta'
    urgente = 'urgente', 'Urgente'
    
class Denuncia(models.Model):
    Titulo = models.CharField(max_length=30)
    Resumo = models.TextField()
    Gravidade = models.CharField(max_length=50,choices=GravidadeDenuncia.choices)
    nome = models.CharField(max_length=40, blank=True)
    telefone = PhoneNumberField(null=False, blank=False)
    foto = models.ImageField(upload_to='fotos/%Y/%m/%d',blank=True,null=True)
    

