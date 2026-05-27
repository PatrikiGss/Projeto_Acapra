from django.db import models
from phonenumber_field.modelfields import PhoneNumberField


class Voluntario(models.Model):
    """
    Modelo para armazenar informações de voluntários.
    Inclui nome, telefone, idade e motivo de interesse.
    """
    nome = models.CharField(
        max_length=200,
        help_text="Nome completo do voluntário"
    )
    
    telefone = PhoneNumberField(
        help_text="Telefone para contato"
    )
    
    idade = models.IntegerField(
        help_text="Idade do voluntário"
    )
    
    motivo = models.TextField(
        help_text="Motivo pelo qual deseja ser voluntário"
    )
    
    email = models.EmailField(
        blank=True,
        null=True,
        help_text="Email para contato (opcional)"
    )
    
    ativo = models.BooleanField(
        default=True,
        help_text="Define se o voluntário está ativo"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Voluntário"
        verbose_name_plural = "Voluntários"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.nome} - {self.idade} anos"
