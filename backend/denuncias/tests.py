from django.test import TestCase
from .models import Denuncia


class DenunciaModelTest(TestCase):

    def setUp(self):

        self.denuncia = Denuncia.objects.create(
            Titulo="Cão abandonado",
            Resumo="Animal abandonado em terreno baldio",
            Gravidade="medio",
            nome="Patriki",
            telefone="+5549999999999"
        )

    def test_criacao_denuncia(self):

        self.assertEqual(
            self.denuncia.Titulo,
            "Cão abandonado"
        )

    def test_gravidade(self):

        self.assertEqual(
            self.denuncia.Gravidade,
            "medio"
        )

    def test_str(self):

        self.assertEqual(
            self.denuncia.Titulo,
            "Cão abandonado"
        )