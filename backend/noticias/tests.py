"""
Testes automatizados para o app `noticias`.

Cobre:
- Model `Publicacao`: criação, defaults, ordering, choices de categoria, __str__.
- CategoriaNoticia.choices: rótulos esperados.
- Serializers `PublicacaoWriteSerializer` e `GetPublicacaoSerializer`:
  fields, categoria_display, foto URL.
- View `PublicacoesView`:
    - GET público lista apenas `ativo=True` para anônimos.
    - GET autenticado lista também inativos.
    - GET filtra por `categoria` válida e ignora inválida.
    - POST sem auth retorna 401.
    - POST autenticado sem permissão de módulo retorna 403.
    - POST com nível administrativo cria publicação (201).
- View `PublicacaoDetailView`:
    - GET público de publicação ativa: 200.
    - GET público de publicação inativa: 404.
    - GET autenticado de publicação inativa: 200.
    - PATCH/DELETE sem auth retornam 401.
    - PATCH/DELETE sem permissão retornam 403.
    - PATCH com nível administrativo atualiza.
    - DELETE com nível administrativo remove.
- URLs do app: namespace `noticias`.
- Admin: registro do model.
"""

import shutil
import tempfile
from io import BytesIO
from unittest import mock

from django.contrib import admin
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.urls import reverse
from PIL import Image
from rest_framework import status
from rest_framework.test import APIClient

from gerenciamento.models import PerfilAdministrativo, Usuario
from noticias.admin import PublicacaoAdmin
from noticias.models import CategoriaNoticia, Publicacao
from noticias.serializers import (
    GetPublicacaoSerializer,
    PublicacaoWriteSerializer,
)


TEMP_MEDIA_ROOT = tempfile.mkdtemp()


def make_image_file(name: str = "noticia.png") -> SimpleUploadedFile:
    """Gera um PNG em memória para uso no ImageField `foto`."""
    buffer = BytesIO()
    image = Image.new("RGB", (10, 10), color=(0, 0, 255))
    image.save(buffer, format="PNG")
    buffer.seek(0)
    return SimpleUploadedFile(name, buffer.read(), content_type="image/png")


def make_publicacao(**kwargs) -> Publicacao:
    """Helper para criar Publicacao com defaults válidos."""
    defaults = {
        "categoria": CategoriaNoticia.NOTICIAS,
        "titulo": "Notícia de Teste",
        "resumo": "Resumo da notícia.",
        "foto": make_image_file(),
        "texto": "Conteúdo completo da notícia de teste.",
        "ativo": True,
    }
    defaults.update(kwargs)
    return Publicacao.objects.create(**defaults)


def make_user(email, phone, nivel=PerfilAdministrativo.Nivel.USUARIO, ativo=True):
    """Cria usuário e ajusta o nível do perfil_admin associado."""
    user = Usuario.objects.create_user(
        email=email,
        password="Senh@F0rte!2026",
        nome=f"User {email}",
        telefone=phone,
    )
    perfil = user.perfil_admin
    perfil.nivel = nivel
    perfil.ativo = ativo
    perfil.save()
    return user


# ----------------------------------------------------------------------
# MODEL
# ----------------------------------------------------------------------
@override_settings(MEDIA_ROOT=TEMP_MEDIA_ROOT)
class PublicacaoModelTests(TestCase):
    """Testes para o model `Publicacao`."""

    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(TEMP_MEDIA_ROOT, ignore_errors=True)
        super().tearDownClass()

    def test_cria_publicacao_com_defaults(self):
        pub = make_publicacao()
        self.assertTrue(pub.ativo)
        self.assertIsNotNone(pub.created_at)
        self.assertIsNotNone(pub.updated_at)

    def test_str_inclui_titulo_e_categoria(self):
        pub = make_publicacao(titulo="Resgate ABC", categoria=CategoriaNoticia.RESGATES)
        self.assertEqual(str(pub), "Resgate ABC (Resgates)")

    def test_ordering_por_created_desc(self):
        antiga = make_publicacao(titulo="Antiga")
        nova = make_publicacao(titulo="Nova")
        titulos = list(Publicacao.objects.values_list("titulo", flat=True))
        self.assertEqual(titulos[0], nova.titulo)
        self.assertEqual(titulos[-1], antiga.titulo)

    def test_categoria_choices(self):
        choices = dict(CategoriaNoticia.choices)
        self.assertEqual(choices["noticias"], "Notícias")
        self.assertEqual(choices["resgates"], "Resgates")
        self.assertEqual(choices["campanhas"], "Campanhas")

    def test_meta_verbose_name(self):
        self.assertEqual(Publicacao._meta.verbose_name, "Publicação")
        self.assertEqual(Publicacao._meta.verbose_name_plural, "Publicações")


# ----------------------------------------------------------------------
# SERIALIZER
# ----------------------------------------------------------------------
@override_settings(MEDIA_ROOT=TEMP_MEDIA_ROOT)
class PublicacaoSerializerTests(TestCase):
    """Testes para os serializers do app."""

    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(TEMP_MEDIA_ROOT, ignore_errors=True)
        super().tearDownClass()

    def setUp(self):
        self.pub = make_publicacao(
            titulo="Campanha de Vacinação",
            categoria=CategoriaNoticia.CAMPANHAS,
        )

    def test_write_serializer_fields(self):
        s = PublicacaoWriteSerializer(self.pub)
        expected = {"id", "categoria", "titulo", "resumo", "foto", "texto", "ativo"}
        self.assertEqual(set(s.data.keys()), expected)

    def test_get_serializer_fields(self):
        s = GetPublicacaoSerializer(self.pub)
        expected = {
            "id",
            "categoria",
            "categoria_display",
            "titulo",
            "resumo",
            "foto",
            "fotos",
            "galeria",
            "texto",
            "ativo",
            "created_at",
        }
        self.assertEqual(set(s.data.keys()), expected)

    def test_get_serializer_categoria_display(self):
        s = GetPublicacaoSerializer(self.pub)
        self.assertEqual(s.data["categoria_display"], "Campanhas")

    def test_get_serializer_foto_returns_url(self):
        s = GetPublicacaoSerializer(self.pub)
        # foto deve estar presente como string (URL relativa)
        self.assertIsInstance(s.data["foto"], str)
        self.assertIn("noticias/", s.data["foto"])

    def test_get_serializer_foto_none_when_empty(self):
        from noticias.serializers import _absolute_file_url
        # _absolute_file_url retorna None para field falsy
        self.assertIsNone(_absolute_file_url(None, None))


# ----------------------------------------------------------------------
# VIEW: PublicacoesView
# ----------------------------------------------------------------------
@override_settings(MEDIA_ROOT=TEMP_MEDIA_ROOT)
class PublicacoesViewTests(TestCase):
    """Testes para `PublicacoesView` em /api/noticias/publicacoes/."""

    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(TEMP_MEDIA_ROOT, ignore_errors=True)
        super().tearDownClass()

    def setUp(self):
        self.client = APIClient()
        self.url = reverse("noticias:publicacoes")

        self.pub_ativa_noticia = make_publicacao(
            titulo="Ativa Notícia",
            categoria=CategoriaNoticia.NOTICIAS,
            ativo=True,
        )
        self.pub_ativa_resgate = make_publicacao(
            titulo="Ativa Resgate",
            categoria=CategoriaNoticia.RESGATES,
            ativo=True,
        )
        self.pub_inativa = make_publicacao(
            titulo="Inativa",
            categoria=CategoriaNoticia.NOTICIAS,
            ativo=False,
        )

        self.user_comum = make_user(
            email="comum@test.com",
            phone="+5511911111111",
            nivel=PerfilAdministrativo.Nivel.USUARIO,
        )
        self.user_master = make_user(
            email="master@test.com",
            phone="+5511922222222",
            nivel=PerfilAdministrativo.Nivel.DIRETOR_ACAPRA,
        )

    # ---- GET (público) ----
    def test_get_anonimo_so_retorna_ativas(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        titulos = [item["titulo"] for item in response.data]
        self.assertIn("Ativa Notícia", titulos)
        self.assertIn("Ativa Resgate", titulos)
        self.assertNotIn("Inativa", titulos)

    def test_get_autenticado_inclui_inativas(self):
        self.client.force_authenticate(user=self.user_comum)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        titulos = [item["titulo"] for item in response.data]
        self.assertIn("Inativa", titulos)

    def test_get_filtra_por_categoria_valida(self):
        response = self.client.get(self.url, {"categoria": "resgates"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        titulos = [item["titulo"] for item in response.data]
        self.assertEqual(titulos, ["Ativa Resgate"])

    def test_get_categoria_invalida_retorna_lista_vazia(self):
        response = self.client.get(self.url, {"categoria": "inexistente"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])

    # ---- POST (requer auth + módulo) ----
    def test_post_sem_auth_retorna_401(self):
        response = self.client.post(self.url, {}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_post_sem_permissao_modulo_retorna_403(self):
        self.client.force_authenticate(user=self.user_comum)
        response = self.client.post(self.url, {}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_post_master_cria_publicacao(self):
        self.client.force_authenticate(user=self.user_master)
        payload = {
            "categoria": "noticias",
            "titulo": "Nova Notícia",
            "resumo": "Resumo curto",
            "foto": make_image_file("nova.png"),
            "texto": "Conteúdo da nova notícia.",
            "ativo": True,
        }
        response = self.client.post(self.url, payload, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(response.data["titulo"], "Nova Notícia")
        self.assertEqual(response.data["categoria_display"], "Notícias")
        self.assertTrue(Publicacao.objects.filter(titulo="Nova Notícia").exists())

    def test_post_master_payload_invalido_retorna_400(self):
        self.client.force_authenticate(user=self.user_master)
        # falta de campos obrigatórios (titulo/texto/foto)
        response = self.client.post(self.url, {"categoria": "noticias"}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # ---- Publicação automática nas redes sociais (Meta) ----
    def _payload_criacao(self, titulo, **extra):
        payload = {
            "categoria": "resgates",
            "titulo": titulo,
            "resumo": "Resumo curto",
            "foto": make_image_file("redes.png"),
            "texto": "Conteúdo da publicação.",
            "ativo": True,
        }
        payload.update(extra)
        return payload

    def test_post_dispara_publicacao_nas_redes(self):
        self.client.force_authenticate(user=self.user_master)
        with mock.patch("meta_integration.services.auto_post_publicacao") as auto_post:
            response = self.client.post(
                self.url, self._payload_criacao("Com redes"), format="multipart"
            )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        auto_post.assert_called_once()
        # Recebe a publicação recém-criada.
        self.assertEqual(auto_post.call_args.args[0].titulo, "Com redes")

    def test_post_com_publicar_redes_false_nao_publica(self):
        self.client.force_authenticate(user=self.user_master)
        with mock.patch("meta_integration.services.auto_post_publicacao") as auto_post:
            response = self.client.post(
                self.url,
                self._payload_criacao("Sem redes", publicar_redes="false"),
                format="multipart",
            )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        auto_post.assert_not_called()

    def test_falha_nas_redes_nao_impede_criacao(self):
        self.client.force_authenticate(user=self.user_master)
        with mock.patch(
            "meta_integration.services.auto_post_publicacao",
            side_effect=RuntimeError("meta fora do ar"),
        ):
            response = self.client.post(
                self.url, self._payload_criacao("Resiliente"), format="multipart"
            )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertTrue(Publicacao.objects.filter(titulo="Resiliente").exists())


# ----------------------------------------------------------------------
# VIEW: PublicacaoDetailView
# ----------------------------------------------------------------------
@override_settings(MEDIA_ROOT=TEMP_MEDIA_ROOT)
class PublicacaoDetailViewTests(TestCase):
    """Testes para `PublicacaoDetailView` em /publicacoes/<pk>/."""

    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(TEMP_MEDIA_ROOT, ignore_errors=True)
        super().tearDownClass()

    def setUp(self):
        self.client = APIClient()

        self.pub_ativa = make_publicacao(titulo="Detalhe Ativa", ativo=True)
        self.pub_inativa = make_publicacao(titulo="Detalhe Inativa", ativo=False)

        self.user_comum = make_user(
            email="user@test.com",
            phone="+5511933333333",
            nivel=PerfilAdministrativo.Nivel.USUARIO,
        )
        self.user_master = make_user(
            email="boss@test.com",
            phone="+5511944444444",
            nivel=PerfilAdministrativo.Nivel.DIRETOR_ACAPRA,
        )

        self.url_ativa = reverse(
            "noticias:publicacao_detail",
            args=[self.pub_ativa.pk],
        )
        self.url_inativa = reverse(
            "noticias:publicacao_detail",
            args=[self.pub_inativa.pk],
        )

    # ---- GET ----
    def test_get_anonimo_publicacao_ativa_retorna_200(self):
        response = self.client.get(self.url_ativa)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["titulo"], "Detalhe Ativa")

    def test_get_anonimo_publicacao_inativa_retorna_404(self):
        response = self.client.get(self.url_inativa)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_get_autenticado_publicacao_inativa_retorna_200(self):
        self.client.force_authenticate(user=self.user_comum)
        response = self.client.get(self.url_inativa)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["titulo"], "Detalhe Inativa")

    def test_get_pk_inexistente_retorna_404(self):
        url = reverse("noticias:publicacao_detail", args=[999999])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # ---- PATCH ----
    def test_patch_sem_auth_retorna_401(self):
        response = self.client.patch(self.url_ativa, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_patch_sem_permissao_retorna_403(self):
        self.client.force_authenticate(user=self.user_comum)
        response = self.client.patch(self.url_ativa, {"titulo": "X"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_patch_master_atualiza_publicacao(self):
        self.client.force_authenticate(user=self.user_master)
        response = self.client.patch(
            self.url_ativa,
            {"titulo": "Título Atualizado"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.pub_ativa.refresh_from_db()
        self.assertEqual(self.pub_ativa.titulo, "Título Atualizado")

    # ---- DELETE ----
    def test_delete_sem_auth_retorna_401(self):
        response = self.client.delete(self.url_ativa)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_delete_sem_permissao_retorna_403(self):
        self.client.force_authenticate(user=self.user_comum)
        response = self.client.delete(self.url_ativa)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_master_remove_publicacao(self):
        self.client.force_authenticate(user=self.user_master)
        pk = self.pub_ativa.pk
        response = self.client.delete(self.url_ativa)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Publicacao.objects.filter(pk=pk).exists())


# ----------------------------------------------------------------------
# URLS
# ----------------------------------------------------------------------
class NoticiasUrlsTests(TestCase):
    """Testes para resolução de URLs do app."""

    def test_reverse_publicacoes(self):
        self.assertEqual(
            reverse("noticias:publicacoes"),
            "/api/noticias/publicacoes/",
        )

    def test_reverse_publicacao_detail(self):
        self.assertEqual(
            reverse("noticias:publicacao_detail", args=[10]),
            "/api/noticias/publicacoes/10/",
        )


# ----------------------------------------------------------------------
# ADMIN
# ----------------------------------------------------------------------
class PublicacaoAdminRegistrationTests(TestCase):
    """Testes para o registro do model no admin."""

    def test_publicacao_admin_registrado(self):
        self.assertIn(Publicacao, admin.site._registry)
        self.assertIsInstance(admin.site._registry[Publicacao], PublicacaoAdmin)

    def test_admin_list_display(self):
        admin_cls = admin.site._registry[Publicacao]
        for field in ("titulo", "categoria", "ativo", "created_at"):
            self.assertIn(field, admin_cls.list_display)
