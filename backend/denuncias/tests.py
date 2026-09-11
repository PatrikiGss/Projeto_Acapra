from django.test import TestCase
from .models import Denuncia


class DenunciaModelTest(TestCase):

    def setUp(self):
        self.denuncia = Denuncia.objects.create(
            titulo="Cão abandonado",
            descricao="Animal abandonado em terreno baldio",
            gravidade="medio",
            nome="Patriki",
            telefone="+5549999999999",
        )

    def test_criacao_denuncia(self):
        self.assertEqual(self.denuncia.titulo, "Cão abandonado")
        self.assertEqual(
            self.denuncia.descricao,
            "Animal abandonado em terreno baldio",
        )

    def test_gravidade(self):
        self.assertEqual(self.denuncia.gravidade, "medio")

    def test_str(self):
        self.assertEqual(str(self.denuncia), "Cão abandonado (Médio)")
