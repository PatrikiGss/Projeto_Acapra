from django.db import models

class Animal(models.Model):
    STATUS_CHOICES = [
        ('disponivel', 'Disponível'),
        ('adotado', 'Adotado'),
        ('reservado', 'Reservado'),
    ]

    nome = models.CharField(max_length=100)
    descricao = models.TextField(blank=True, null=True)
    raca = models.CharField('raça', max_length=100)
    especie = models.CharField(max_length=100)
    idade = models.PositiveIntegerField()
    vacinado = models.BooleanField(default=False)
    porte = models.CharField(max_length=50)
    foto = models.ImageField(upload_to='animais/', blank=True, null=True)
    status = models.CharField(max_length=12, choices=STATUS_CHOICES, default='disponivel')
    data_criacao = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nome
    
    

