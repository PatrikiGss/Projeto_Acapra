from io import BytesIO

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from PIL import Image

from .models import Produto, TipoVestuario
from .serializers import ProdutoSerializer, UpdateProdutoSerializer


def criar_imagem(nome):
    buffer = BytesIO()
    Image.new("RGB", (1, 1), color="white").save(buffer, format="PNG")
    return SimpleUploadedFile(nome, buffer.getvalue(), content_type="image/png")


class ProdutoSerializerFotosTests(TestCase):
    def setUp(self):
        self.dados_base = {
            "nome": "Camiseta ACAPRA",
            "descricao": "Produto para teste",
            "tipo": TipoVestuario.HUMANO,
            "preco": "59.90",
            "estoque": 3,
            "ativo": True,
        }

    def test_create_aceita_multiplas_fotos(self):
        serializer = ProdutoSerializer(
            data={
                **self.dados_base,
                "fotos": [criar_imagem("produto-1.png"), criar_imagem("produto-2.png")],
            }
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)

        produto = serializer.save()

        self.assertEqual(produto.imagens.count(), 2)
        self.assertEqual(produto.imagens.first().ordem, 0)

    def test_update_aceita_multiplas_fotos_adicionais(self):
        produto = Produto.objects.create(
            nome="Coleira ACAPRA",
            descricao="Produto inicial",
            tipo=TipoVestuario.PET,
            preco="29.90",
            estoque=5,
            ativo=True,
        )

        serializer = UpdateProdutoSerializer(
            produto,
            data={
                "descricao": "Produto editado",
                "fotos": [criar_imagem("produto-3.png"), criar_imagem("produto-4.png")],
            },
            partial=True,
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)

        produto = serializer.save()

        self.assertEqual(produto.descricao, "Produto editado")
        self.assertEqual(produto.imagens.count(), 2)
