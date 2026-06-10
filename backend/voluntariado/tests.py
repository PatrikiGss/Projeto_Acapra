"""
Testes automatizados para o app `voluntariado`.

Cobre:
- Model `Voluntario`: criação, defaults, ordering, __str__.
- Serializer `CreateVoluntarioSerializer`: validações de `idade` e `motivo`.
- Serializer `GetVoluntarioSerializer` e `VoluntarioSerializer`: fields e read-only.
- View `VoluntariosView`:
    - POST público cria voluntário (201)
    - POST inválido retorna 400
    - GET sem autenticação retorna 401
    - GET autenticado lista voluntários
- View `VoluntarioDetailView`:
    - GET / PATCH / DELETE exigem autenticação
    - GET retorna 200 ou 404
    - PATCH atualiza parcialmente
    - DELETE remove voluntário (204)
- URLs do app: namespace `voluntariado`.
- Admin: registro do model.
"""

from django.contrib import admin
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from gerenciamento.models import Usuario
from voluntariado.admin import VoluntarioAdmin
from voluntariado.models import Voluntario
from voluntariado.serializers import (
    CreateVoluntarioSerializer,
    GetVoluntarioSerializer,
    VoluntarioSerializer,
)


VALID_PHONE = "+5511999999999"
ANOTHER_PHONE = "+5511988888888"


def make_voluntario(**kwargs):
    """Helper para criar voluntário com defaults válidos."""
    defaults = {
        "nome": "Maria Voluntaria",
        "telefone": VALID_PHONE,
        "idade": 25,
        "motivo": "Quero ajudar os animais abandonados de Lages.",
        "email": "maria@example.com",
        "ativo": True,
    }
    defaults.update(kwargs)
    return Voluntario.objects.create(**defaults)


def make_admin_user(email="admin@test.com", phone="+5511977777777", password="Senh@F0rte!2026"):
    """Helper para criar usuário autenticável."""
    return Usuario.objects.create_user(
        email=email,
        password=password,
        nome="Admin Teste",
        telefone=phone,
    )


# ----------------------------------------------------------------------
# MODEL
# ----------------------------------------------------------------------
class VoluntarioModelTests(TestCase):
    """Testes para o model `Voluntario`."""

    def test_cria_voluntario_com_defaults(self):
        """Voluntário recém-criado deve estar ativo por padrão."""
        v = make_voluntario()
        self.assertTrue(v.ativo)
        self.assertIsNotNone(v.created_at)
        self.assertIsNotNone(v.updated_at)

    def test_str_returns_expected_format(self):
        """__str__ deve seguir o padrão `<nome> - <idade> anos`."""
        v = make_voluntario(nome="João Silva", idade=30)
        self.assertEqual(str(v), "João Silva - 30 anos")

    def test_ordering_is_created_desc(self):
        """Voluntários mais recentes vêm primeiro."""
        v_old = make_voluntario(nome="Antigo", telefone="+5511966666666")
        v_new = make_voluntario(nome="Novo", telefone="+5511955555555")
        ids = list(Voluntario.objects.values_list("id", flat=True))
        self.assertEqual(ids[0], v_new.id)
        self.assertEqual(ids[-1], v_old.id)

    def test_email_pode_ser_nulo(self):
        """O campo `email` deve aceitar `null`."""
        v = make_voluntario(email=None, telefone="+5511944444444")
        self.assertIsNone(v.email)

    def test_meta_verbose_name(self):
        self.assertEqual(Voluntario._meta.verbose_name, "Voluntário")
        self.assertEqual(Voluntario._meta.verbose_name_plural, "Voluntários")


# ----------------------------------------------------------------------
# SERIALIZER
# ----------------------------------------------------------------------
class CreateVoluntarioSerializerTests(TestCase):
    """Testes para o serializer de criação pública."""

    def base_payload(self, **overrides):
        payload = {
            "nome": "Teste Serializer",
            "telefone": VALID_PHONE,
            "idade": 25,
            "motivo": "Tenho amor pelos animais e quero contribuir.",
            "email": "teste@example.com",
        }
        payload.update(overrides)
        return payload

    def test_payload_valido(self):
        serializer = CreateVoluntarioSerializer(data=self.base_payload())
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_idade_negativa_invalida(self):
        serializer = CreateVoluntarioSerializer(data=self.base_payload(idade=-1))
        self.assertFalse(serializer.is_valid())
        self.assertIn("idade", serializer.errors)

    def test_idade_muito_alta_invalida(self):
        serializer = CreateVoluntarioSerializer(data=self.base_payload(idade=200))
        self.assertFalse(serializer.is_valid())
        self.assertIn("idade", serializer.errors)

    def test_motivo_curto_invalido(self):
        serializer = CreateVoluntarioSerializer(
            data=self.base_payload(motivo="curto")
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("motivo", serializer.errors)

    def test_motivo_minimo_10_chars(self):
        """Motivo com exatamente 10 caracteres deve ser válido."""
        serializer = CreateVoluntarioSerializer(
            data=self.base_payload(motivo="1234567890")
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_email_opcional(self):
        payload = self.base_payload()
        payload.pop("email")
        serializer = CreateVoluntarioSerializer(data=payload)
        self.assertTrue(serializer.is_valid(), serializer.errors)


class GetVoluntarioSerializerTests(TestCase):
    """Testes para o serializer de listagem."""

    def test_fields_expostos(self):
        v = make_voluntario()
        serializer = GetVoluntarioSerializer(v)
        expected = {"id", "nome", "telefone", "idade", "motivo", "email", "created_at"}
        self.assertEqual(set(serializer.data.keys()), expected)

    def test_ativo_nao_exposto(self):
        v = make_voluntario()
        serializer = GetVoluntarioSerializer(v)
        self.assertNotIn("ativo", serializer.data)


class VoluntarioSerializerTests(TestCase):
    """Testes para o serializer principal (uso interno em PATCH)."""

    def test_id_e_ativo_sao_readonly(self):
        serializer = VoluntarioSerializer()
        read_only = set(serializer.Meta.read_only_fields)
        self.assertIn("id", read_only)
        self.assertIn("ativo", read_only)


# ----------------------------------------------------------------------
# VIEW: VoluntariosView
# ----------------------------------------------------------------------
class VoluntariosViewTests(TestCase):
    """Testes para `VoluntariosView` em /api/voluntariado/voluntarios/."""

    def setUp(self):
        self.client = APIClient()
        self.url = reverse("voluntariado:voluntarios")
        self.user = make_admin_user()

    def auth(self):
        self.client.force_authenticate(user=self.user)

    # ---- POST (público) ----
    def test_post_publico_cria_voluntario(self):
        payload = {
            "nome": "Carlos Voluntario",
            "telefone": ANOTHER_PHONE,
            "idade": 28,
            "motivo": "Quero ajudar a ACAPRA salvar vidas.",
            "email": "carlos@example.com",
        }
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["nome"], "Carlos Voluntario")
        self.assertIn("id", response.data)
        self.assertTrue(Voluntario.objects.filter(nome="Carlos Voluntario").exists())

    def test_post_payload_invalido_retorna_400(self):
        payload = {
            "nome": "Sem motivo",
            "telefone": ANOTHER_PHONE,
            "idade": 25,
            "motivo": "curto",
        }
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("motivo", response.data)

    def test_post_payload_sem_campos_obrigatorios_retorna_400(self):
        response = self.client.post(self.url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # ---- GET (autenticado) ----
    def test_get_sem_autenticacao_retorna_401(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_autenticado_lista_voluntarios(self):
        make_voluntario(nome="V1", telefone="+5511933333333", email="v1@x.com")
        make_voluntario(nome="V2", telefone="+5511922222222", email="v2@x.com")

        self.auth()
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        nomes = [item["nome"] for item in response.data]
        self.assertIn("V1", nomes)
        self.assertIn("V2", nomes)


# ----------------------------------------------------------------------
# VIEW: VoluntarioDetailView
# ----------------------------------------------------------------------
class VoluntarioDetailViewTests(TestCase):
    """Testes para `VoluntarioDetailView` em /voluntarios/<pk>/."""

    def setUp(self):
        self.client = APIClient()
        self.user = make_admin_user()
        self.voluntario = make_voluntario()
        self.url = reverse(
            "voluntariado:voluntario_detail",
            args=[self.voluntario.pk],
        )

    def auth(self):
        self.client.force_authenticate(user=self.user)

    # ---- Auth obrigatória ----
    def test_get_sem_autenticacao_retorna_401(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_patch_sem_autenticacao_retorna_401(self):
        response = self.client.patch(self.url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_delete_sem_autenticacao_retorna_401(self):
        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # ---- GET ----
    def test_get_voluntario_existente(self):
        self.auth()
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.voluntario.pk)
        self.assertEqual(response.data["nome"], self.voluntario.nome)

    def test_get_voluntario_inexistente_retorna_404(self):
        self.auth()
        url = reverse("voluntariado:voluntario_detail", args=[999999])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn("não encontrado", response.data["detail"])

    # ---- PATCH ----
    def test_patch_atualiza_dados(self):
        self.auth()
        response = self.client.patch(
            self.url,
            {"nome": "Nome Atualizado"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.voluntario.refresh_from_db()
        self.assertEqual(self.voluntario.nome, "Nome Atualizado")

    def test_patch_voluntario_inexistente_retorna_404(self):
        self.auth()
        url = reverse("voluntariado:voluntario_detail", args=[999999])
        response = self.client.patch(url, {"nome": "X"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # ---- DELETE ----
    def test_delete_remove_voluntario(self):
        self.auth()
        pk = self.voluntario.pk
        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Voluntario.objects.filter(pk=pk).exists())

    def test_delete_voluntario_inexistente_retorna_404(self):
        self.auth()
        url = reverse("voluntariado:voluntario_detail", args=[999999])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


# ----------------------------------------------------------------------
# URLS
# ----------------------------------------------------------------------
class VoluntariadoUrlsTests(TestCase):
    """Testes para resolução de URLs do app."""

    def test_reverse_voluntarios_url(self):
        self.assertEqual(
            reverse("voluntariado:voluntarios"),
            "/api/voluntariado/voluntarios/",
        )

    def test_reverse_voluntario_detail_url(self):
        self.assertEqual(
            reverse("voluntariado:voluntario_detail", args=[7]),
            "/api/voluntariado/voluntarios/7/",
        )


# ----------------------------------------------------------------------
# ADMIN
# ----------------------------------------------------------------------
class VoluntarioAdminRegistrationTests(TestCase):
    """Testes para registro do model no admin."""

    def test_voluntario_admin_registrado(self):
        self.assertIn(Voluntario, admin.site._registry)
        self.assertIsInstance(admin.site._registry[Voluntario], VoluntarioAdmin)

    def test_admin_list_display(self):
        admin_cls = admin.site._registry[Voluntario]
        for field in ("nome", "idade", "telefone", "ativo", "created_at"):
            self.assertIn(field, admin_cls.list_display)
