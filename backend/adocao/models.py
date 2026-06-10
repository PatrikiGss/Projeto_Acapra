from django.db import models
from phonenumber_field.modelfields import PhoneNumberField


class EspecieAnimal(models.TextChoices):
    CACHORRO = 'cachorro', 'Cachorro'
    GATO = 'gato', 'Gato'
    OUTROS = 'outros', 'Outros'


class SexoAnimal(models.TextChoices):
    MACHO = 'macho', 'Macho'
    FEMEA = 'femea', 'Fêmea'


class Animal(models.Model):
    nome_animal = models.CharField(max_length=30)
    
    nome_doador = models.CharField(max_length=30)
    
    telefone = PhoneNumberField()

    especie = models.CharField(
        max_length=10,
        choices=EspecieAnimal.choices
    )

    sexo = models.CharField(
        max_length=10,
        choices=SexoAnimal.choices
    )



    foto = models.ImageField(
        upload_to='fotos/%Y/%m/%d',
        blank=True,
        null=True
    )

    descricao = models.TextField(
        max_length=500,
        blank=True,
        null=True
    )

    def __str__(self):
        return f"{self.nome_doador} - {self.especie}"


class AnimalImagem(models.Model):
    animal = models.ForeignKey(
        Animal,
        related_name="imagens",
        on_delete=models.CASCADE,
    )
    imagem = models.ImageField(
        upload_to="fotos/%Y/%m/%d",
    )
    ordem = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["ordem", "id"]
        verbose_name = "Foto do animal"
        verbose_name_plural = "Fotos dos animais"

    def __str__(self):
        return f"Foto de {self.animal.nome_animal}"
