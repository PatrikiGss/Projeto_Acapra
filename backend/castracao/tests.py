"""
Testes automatizados para o app `castracao`.

Cobre:
- Model `PedidoCastracao`: defaults, ordering, __str__.
- Serializers: criação pública (campos e validação de nome) e listagem admin.
- View `CastracoesView`:
    - POST público cria pedido (201)
    - POST inválido retorna 400
    - GET sem autenticação retorna 401
    - GET de usuário sem vínculo administrativo retorna 403
    - GET autenticado com módulo lista os pedidos
- View `CastracaoDetailView`: GET / PATCH (status) / DELETE restritos a admin.
- URLs do app: namespace `castracao`.
- Admin: registro do model.
"""

from django.contrib import admin
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from castracao.admin import PedidoCastracaoAdmin
from castracao.models import PedidoCastracao
from castracao.serializers import (
    CreatePedidoCastracaoSerializer,
    GetPedidoCastracaoSerializer,
)
from gerenciamento.models import PerfilAdministrativo, Usuario

VALID_PHONE = "+5549999999999"
ANOTHER_PHONE = "+5549988888888"


def make_pedido(**kwargs):
    """Helper para criar pedido de castração com defaults válidos."""
    defaults = {
        "nome": "Maria Silva",
        "telefone": VALID_PHONE,
        "email": "maria@example.com",
        "tipo_animal": "gato",
        "sexo": "femea",
        "observacoes": "Gata SRD de 2 anos.",
    }
    defaults.update(kwargs)
    return PedidoCastracao.objects.create(**defaults)


def make_admin_user(
    email="admin@test.com",
    phone="+5549977777777",
    password="Senh@F0rte!2026",
    nivel=PerfilAdministrativo.Nivel.DIRETOR_ACAPRA,
):
    """Cria usuário com nível administrativo (acesso ao módulo de castração)."""
    user = Usuario.objects.create_user(
        email=email,
        password=password,
        nome="Admin Teste",
        telefone=phone,
    )
    perfil = user.perfil_admin
    perfil.nivel = nivel
    perfil.save(update_fields=["nivel"])
    return user


# ----------------------------------------------------------------------
# MODEL
# ----------------------------------------------------------------------
class PedidoCastracaoModelTests(TestCase):
    def test_status_padrao_e_pendente(self):
        pedido = make_pedido()
        self.assertEqual(pedido.status, "pendente")
        self.assertIsNotNone(pedido.created_at)
        self.assertIsNotNone(pedido.updated_at)

    def test_str_inclui_nome_tipo_e_sexo(self):
        pedido = make_pedido(nome="João Souza", tipo_animal="cachorro", sexo="macho")
        self.assertEqual(str(pedido), "João Souza - Cachorro (Macho)")

    def test_ordering_mais_recente_primeiro(self):
        antigo = make_pedido(nome="Antigo")
        novo = make_pedido(nome="Novo", telefone=ANOTHER_PHONE)
        ids = list(PedidoCastracao.objects.values_list("id", flat=True))
        self.assertEqual(ids[0], novo.id)
        self.assertEqual(ids[-1], antigo.id)

    def test_email_e_observacoes_sao_opcionais(self):
        pedido = make_pedido(email=None, observacoes="")
        self.assertIsNone(pedido.email)
        self.assertEqual(pedido.observacoes, "")


# ----------------------------------------------------------------------
# SERIALIZERS
# ----------------------------------------------------------------------
class CreatePedidoCastracaoSerializerTests(TestCase):
    def base_payload(self, **overrides):
        payload = {
            "nome": "Ana Paula",
            "telefone": VALID_PHONE,
            "email": "ana@example.com",
            "tipo_animal": "cachorro",
            "sexo": "femea",
            "observacoes": "Cadela de pequeno porte.",
        }
        payload.update(overrides)
        return payload

    def test_payload_valido(self):
        serializer = CreatePedidoCastracaoSerializer(data=self.base_payload())
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_status_nao_e_aceito_no_cadastro_publico(self):
        """Quem envia o pedido não escolhe o andamento."""
        serializer = CreatePedidoCastracaoSerializer(
            data=self.base_payload(status="realizada")
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        pedido = serializer.save()
        self.assertEqual(pedido.status, "pendente")

    def test_tipo_animal_invalido(self):
        serializer = CreatePedidoCastracaoSerializer(
            data=self.base_payload(tipo_animal="dragao")
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("tipo_animal", serializer.errors)

    def test_sexo_invalido(self):
        serializer = CreatePedidoCastracaoSerializer(data=self.base_payload(sexo="x"))
        self.assertFalse(serializer.is_valid())
        self.assertIn("sexo", serializer.errors)

    def test_nome_curto_invalido(self):
        serializer = CreatePedidoCastracaoSerializer(data=self.base_payload(nome="Jo"))
        self.assertFalse(serializer.is_valid())
        self.assertIn("nome", serializer.errors)

    def test_email_e_observacoes_opcionais(self):
        payload = self.base_payload()
        payload.pop("email")
        payload.pop("observacoes")
        serializer = CreatePedidoCastracaoSerializer(data=payload)
        self.assertTrue(serializer.is_valid(), serializer.errors)


class GetPedidoCastracaoSerializerTests(TestCase):
    def test_fields_expostos(self):
        serializer = GetPedidoCastracaoSerializer(make_pedido())
        expected = {
            "id", "nome", "telefone", "email", "tipo_animal", "tipo_animal_display",
            "sexo", "sexo_display", "observacoes", "status", "status_display",
            "created_at",
        }
        self.assertEqual(set(serializer.data.keys()), expected)

    def test_displays_legiveis(self):
        serializer = GetPedidoCastracaoSerializer(
            make_pedido(tipo_animal="outros", sexo="macho")
        )
        self.assertEqual(serializer.data["tipo_animal_display"], "Outros")
        self.assertEqual(serializer.data["sexo_display"], "Macho")
        self.assertEqual(serializer.data["status_display"], "Pendente")


# ----------------------------------------------------------------------
# VIEW: CastracoesView
# ----------------------------------------------------------------------
class CastracoesViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = reverse("castracao:castracoes")
        self.user = make_admin_user()

    def auth(self):
        self.client.force_authenticate(user=self.user)

    # ---- POST (público) ----
    def test_post_publico_cria_pedido(self):
        payload = {
            "nome": "Carlos Pereira",
            "telefone": ANOTHER_PHONE,
            "tipo_animal": "gato",
            "sexo": "macho",
        }
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("id", response.data)
        self.assertTrue(PedidoCastracao.objects.filter(nome="Carlos Pereira").exists())

    def test_post_sem_campos_obrigatorios_retorna_400(self):
        response = self.client.post(self.url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_post_com_tipo_animal_invalido_retorna_400(self):
        payload = {
            "nome": "Carlos Pereira",
            "telefone": ANOTHER_PHONE,
            "tipo_animal": "cavalo_alado",
            "sexo": "macho",
        }
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("tipo_animal", response.data)

    # ---- GET (restrito) ----
    def test_get_sem_autenticacao_retorna_401(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_usuario_sem_vinculo_retorna_403(self):
        """Usuário logado, mas sem nível administrativo, não vê os dados."""
        comum = make_admin_user(
            email="comum@test.com",
            phone="+5549966666666",
            nivel=PerfilAdministrativo.Nivel.USUARIO,
        )
        self.client.force_authenticate(user=comum)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_get_admin_lista_pedidos(self):
        make_pedido(nome="P1")
        make_pedido(nome="P2", telefone=ANOTHER_PHONE)

        self.auth()
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        nomes = [item["nome"] for item in response.data]
        self.assertIn("P1", nomes)
        self.assertIn("P2", nomes)

    def test_auxiliar_geral_tem_acesso(self):
        auxiliar = make_admin_user(
            email="auxiliar@test.com",
            phone="+5549955555555",
            nivel=PerfilAdministrativo.Nivel.AUXILIAR_GERAL,
        )
        self.client.force_authenticate(user=auxiliar)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


# ----------------------------------------------------------------------
# VIEW: CastracaoDetailView
# ----------------------------------------------------------------------
class CastracaoDetailViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = make_admin_user()
        self.pedido = make_pedido()
        self.url = reverse("castracao:castracao_detail", args=[self.pedido.pk])

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
    def test_get_pedido_existente(self):
        self.auth()
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.pedido.pk)

    def test_get_pedido_inexistente_retorna_404(self):
        self.auth()
        url = reverse("castracao:castracao_detail", args=[999999])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # ---- PATCH ----
    def test_patch_atualiza_status(self):
        self.auth()
        response = self.client.patch(self.url, {"status": "agendada"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.pedido.refresh_from_db()
        self.assertEqual(self.pedido.status, "agendada")
        self.assertEqual(response.data["status_display"], "Agendada")

    def test_patch_status_invalido_retorna_400(self):
        self.auth()
        response = self.client.patch(self.url, {"status": "cancelado"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_patch_nao_altera_contato(self):
        """O PATCH admin só mexe no andamento; contato vem do formulário."""
        self.auth()
        self.client.patch(self.url, {"nome": "Outro Nome"}, format="json")
        self.pedido.refresh_from_db()
        self.assertEqual(self.pedido.nome, "Maria Silva")

    # ---- DELETE ----
    def test_delete_remove_pedido(self):
        self.auth()
        pk = self.pedido.pk
        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(PedidoCastracao.objects.filter(pk=pk).exists())

    def test_delete_pedido_inexistente_retorna_404(self):
        self.auth()
        url = reverse("castracao:castracao_detail", args=[999999])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


# ----------------------------------------------------------------------
# URLS
# ----------------------------------------------------------------------
class CastracaoUrlsTests(TestCase):
    def test_reverse_castracoes_url(self):
        self.assertEqual(
            reverse("castracao:castracoes"),
            "/api/castracao/castracoes/",
        )

    def test_reverse_castracao_detail_url(self):
        self.assertEqual(
            reverse("castracao:castracao_detail", args=[7]),
            "/api/castracao/castracoes/7/",
        )


# ----------------------------------------------------------------------
# ADMIN
# ----------------------------------------------------------------------
class PedidoCastracaoAdminRegistrationTests(TestCase):
    def test_model_registrado_no_admin(self):
        self.assertIn(PedidoCastracao, admin.site._registry)
        self.assertIsInstance(
            admin.site._registry[PedidoCastracao], PedidoCastracaoAdmin
        )

    def test_admin_list_display(self):
        admin_cls = admin.site._registry[PedidoCastracao]
        for field in ("nome", "tipo_animal", "sexo", "telefone", "status", "created_at"):
            self.assertIn(field, admin_cls.list_display)
