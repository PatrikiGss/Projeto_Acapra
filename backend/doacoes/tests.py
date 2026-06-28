"""
Testes automatizados para o app `doacoes`.

Cobre:
- Model `DadosPix`: criação, defaults, __str__ e Meta.
- Serializers `DadosPixWriteSerializer` e `GetDadosPixSerializer`: fields e read_only.
- View `DadosPixView` (GET): lista pública apenas registros `ativo=True`,
  acesso AllowAny e ordenação por `-id`.
- View `DadosPixDetailView` (GET): retorna 200 para PIX ativo,
  404 para inexistente ou inativo.
- URLs do app: namespace `doacoes` e reverse de `pix` / `pix_detail`.
- Admin: registro do model.
"""

import shutil
import tempfile
from io import BytesIO

from django.contrib import admin
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.urls import reverse
from PIL import Image
from rest_framework import status
from rest_framework.test import APIClient

from doacoes.admin import DadosPixAdmin
from doacoes.models import DadosPix
from doacoes.serializers import DadosPixWriteSerializer, GetDadosPixSerializer


TEMP_MEDIA_ROOT = tempfile.mkdtemp()


def make_image_file(name: str = "qr.png") -> SimpleUploadedFile:
    """Gera um arquivo PNG válido em memória para uso em `ImageField`."""
    buffer = BytesIO()
    image = Image.new("RGB", (10, 10), color=(255, 0, 0))
    image.save(buffer, format="PNG")
    buffer.seek(0)
    return SimpleUploadedFile(name, buffer.read(), content_type="image/png")


@override_settings(MEDIA_ROOT=TEMP_MEDIA_ROOT)
class DadosPixModelTests(TestCase):
    """Testes para o model `DadosPix`."""

    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(TEMP_MEDIA_ROOT, ignore_errors=True)
        super().tearDownClass()

    def test_cria_dados_pix_com_defaults(self):
        """Pix criado deve estar ativo por padrão e ter timestamps."""
        pix = DadosPix.objects.create(
            chave_pix="chave@email.com",
            qr_code=make_image_file(),
        )
        self.assertTrue(pix.ativo)
        self.assertIsNotNone(pix.created_at)
        self.assertIsNotNone(pix.updated_at)

    def test_str_returns_expected_format(self):
        """__str__ deve seguir o formato `Pix: <chave>`."""
        pix = DadosPix.objects.create(
            chave_pix="11999999999",
            qr_code=make_image_file(),
        )
        self.assertEqual(str(pix), "Pix: 11999999999")

    def test_chave_pix_must_be_unique(self):
        """`chave_pix` é unique — duplicar deve quebrar a constraint."""
        DadosPix.objects.create(
            chave_pix="chave-unica",
            qr_code=make_image_file("a.png"),
        )
        from django.db import IntegrityError

        with self.assertRaises(IntegrityError):
            DadosPix.objects.create(
                chave_pix="chave-unica",
                qr_code=make_image_file("b.png"),
            )

    def test_descricao_opcional(self):
        """`descricao` pode ser None/blank."""
        pix = DadosPix.objects.create(
            chave_pix="chave-sem-desc",
            qr_code=make_image_file(),
        )
        self.assertIsNone(pix.descricao)

    def test_meta_verbose_name(self):
        """Verbose names em português configurados."""
        self.assertEqual(DadosPix._meta.verbose_name, "Dados Pix")
        self.assertEqual(DadosPix._meta.verbose_name_plural, "Dados Pix")


@override_settings(MEDIA_ROOT=TEMP_MEDIA_ROOT)
class DadosPixSerializerTests(TestCase):
    """Testes para os serializers do app."""

    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(TEMP_MEDIA_ROOT, ignore_errors=True)
        super().tearDownClass()

    def setUp(self):
        self.pix = DadosPix.objects.create(
            chave_pix="serializer@test.com",
            qr_code=make_image_file(),
            descricao="Descrição teste",
        )

    def test_write_serializer_expoe_campos_editaveis(self):
        """O serializer de escrita expõe os campos editáveis dos dados Pix."""
        serializer = DadosPixWriteSerializer(self.pix)
        expected_fields = {
            "id", "chave_pix", "qr_code", "descricao",
            "banco", "agencia", "conta", "tipo_conta",
            "cnpj", "favorecido", "ativo",
        }
        self.assertEqual(set(serializer.data.keys()), expected_fields)

    def test_write_serializer_remover_qr_code_write_only(self):
        """`remover_qr_code` é apenas de escrita e não aparece na saída."""
        serializer = DadosPixWriteSerializer(self.pix)
        self.assertNotIn("remover_qr_code", serializer.data)
        self.assertTrue(serializer.fields["remover_qr_code"].write_only)

    def test_get_dadospix_serializer_fields(self):
        """GetDadosPixSerializer expõe os campos públicos necessários para doação."""
        serializer = GetDadosPixSerializer(self.pix)
        expected_fields = {
            "id", "chave_pix", "qr_code", "descricao",
            "banco", "agencia", "conta", "tipo_conta",
            "cnpj", "favorecido",
        }
        self.assertEqual(set(serializer.data.keys()), expected_fields)

    def test_get_dadospix_does_not_expose_ativo(self):
        """`ativo` (flag interna) não deve aparecer no serializer público."""
        serializer = GetDadosPixSerializer(self.pix)
        self.assertNotIn("ativo", serializer.data)


@override_settings(MEDIA_ROOT=TEMP_MEDIA_ROOT)
class DadosPixListViewTests(TestCase):
    """Testes para `DadosPixView` (GET /api/doacoes/pix/)."""

    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(TEMP_MEDIA_ROOT, ignore_errors=True)
        super().tearDownClass()

    def setUp(self):
        self.client = APIClient()
        self.url = reverse("doacoes:dados_pix")

        self.pix_ativo_1 = DadosPix.objects.create(
            chave_pix="ativo1@test.com",
            qr_code=make_image_file("ativo1.png"),
            ativo=True,
        )
        self.pix_ativo_2 = DadosPix.objects.create(
            chave_pix="ativo2@test.com",
            qr_code=make_image_file("ativo2.png"),
            ativo=True,
        )
        self.pix_inativo = DadosPix.objects.create(
            chave_pix="inativo@test.com",
            qr_code=make_image_file("inativo.png"),
            ativo=False,
        )

    def test_get_returns_200(self):
        """GET deve retornar 200 OK."""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_get_only_returns_active_pix(self):
        """Apenas registros com `ativo=True` devem ser retornados."""
        response = self.client.get(self.url)
        chaves = [item["chave_pix"] for item in response.data]
        self.assertIn("ativo1@test.com", chaves)
        self.assertIn("ativo2@test.com", chaves)
        self.assertNotIn("inativo@test.com", chaves)

    def test_get_ordered_by_id_desc(self):
        """A lista é ordenada por -id (mais recentes primeiro)."""
        response = self.client.get(self.url)
        ids = [item["id"] for item in response.data]
        self.assertEqual(ids, sorted(ids, reverse=True))

    def test_get_is_public_allow_any(self):
        """O endpoint não exige autenticação."""
        # Cliente sem token
        self.client.credentials()
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


@override_settings(MEDIA_ROOT=TEMP_MEDIA_ROOT)
class DadosPixDetailViewTests(TestCase):
    """Testes para `DadosPixDetailView` (GET /api/doacoes/pix/<pk>/)."""

    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(TEMP_MEDIA_ROOT, ignore_errors=True)
        super().tearDownClass()

    def setUp(self):
        self.client = APIClient()
        self.pix_ativo = DadosPix.objects.create(
            chave_pix="detalhe@test.com",
            qr_code=make_image_file(),
            ativo=True,
        )
        self.pix_inativo = DadosPix.objects.create(
            chave_pix="detalhe-inativo@test.com",
            qr_code=make_image_file("inativo.png"),
            ativo=False,
        )

    def test_get_active_pix_returns_200(self):
        """Pix ativo retorna 200 e o payload correto."""
        url = reverse("doacoes:dados_pix_detail", args=[self.pix_ativo.pk])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["chave_pix"], "detalhe@test.com")

    def test_get_inactive_pix_returns_404(self):
        """Pix inativo retorna 404 com mensagem apropriada."""
        url = reverse("doacoes:dados_pix_detail", args=[self.pix_inativo.pk])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn("não encontrados", response.data["detail"])

    def test_get_nonexistent_pix_returns_404(self):
        """ID inexistente retorna 404."""
        url = reverse("doacoes:dados_pix_detail", args=[999999])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_detail_endpoint_is_public(self):
        """O endpoint de detalhe não exige autenticação."""
        url = reverse("doacoes:dados_pix_detail", args=[self.pix_ativo.pk])
        self.client.credentials()
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class DoacoesUrlsTests(TestCase):
    """Testes para URLs do app."""

    def test_reverse_list_url(self):
        self.assertEqual(reverse("doacoes:dados_pix"), "/api/doacoes/pix/")

    def test_reverse_detail_url(self):
        self.assertEqual(
            reverse("doacoes:dados_pix_detail", args=[42]),
            "/api/doacoes/pix/42/",
        )


class DadosPixAdminRegistrationTests(TestCase):
    """Testes para o admin do model."""

    def test_dadospix_admin_registered(self):
        self.assertIn(DadosPix, admin.site._registry)
        self.assertIsInstance(admin.site._registry[DadosPix], DadosPixAdmin)

    def test_admin_list_display(self):
        admin_cls = admin.site._registry[DadosPix]
        self.assertIn("chave_pix", admin_cls.list_display)
        self.assertIn("ativo", admin_cls.list_display)


class OfertaDoacaoTelefoneValidationTests(TestCase):
    """Validação do telefone da oferta de doação via phonenumbers."""

    def setUp(self):
        self.client = APIClient()
        self.url = reverse("doacoes:ofertas")
        self.base = {
            "nome_doador": "Maria",
            "item": "Ração",
            "categoria": "alimento",
        }

    def _payload(self, telefone):
        return {**self.base, "telefone": telefone}

    def test_serializer_aceita_telefone_e164_valido(self):
        from doacoes.serializers import OfertaDoacaoCreateSerializer

        serializer = OfertaDoacaoCreateSerializer(data=self._payload("+5549999990000"))
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_serializer_recusa_telefone_invalido(self):
        from doacoes.serializers import OfertaDoacaoCreateSerializer

        for telefone in ["abc", "+5549999", "(49) 99999-0000", "123"]:
            serializer = OfertaDoacaoCreateSerializer(data=self._payload(telefone))
            self.assertFalse(serializer.is_valid(), f"deveria recusar {telefone!r}")
            self.assertIn("telefone", serializer.errors)

    def test_serializer_recusa_telefone_vazio(self):
        from doacoes.serializers import OfertaDoacaoCreateSerializer

        serializer = OfertaDoacaoCreateSerializer(data=self._payload(""))
        self.assertFalse(serializer.is_valid())
        self.assertIn("telefone", serializer.errors)

    def test_post_publico_cria_com_telefone_valido(self):
        from doacoes.models import OfertaDoacao

        resp = self.client.post(self.url, self._payload("+5549999990000"), format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.data)
        self.assertEqual(OfertaDoacao.objects.count(), 1)

    def test_post_publico_rejeita_telefone_invalido(self):
        from doacoes.models import OfertaDoacao

        resp = self.client.post(self.url, self._payload("abc"), format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(OfertaDoacao.objects.count(), 0)
