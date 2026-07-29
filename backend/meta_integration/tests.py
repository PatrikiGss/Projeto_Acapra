"""
Testes do app `meta_integration`.

Cobrem o que foi adicionado na última rodada: publicação de STORY (Instagram e
Facebook), a publicação de NOTÍCIAS nas redes (`auto_post_publicacao`), o
registro enxuto de falhas (`MetaPostLog` + poda) e a montagem da URL pública da
imagem (com o prefixo `/api` exigido pelo deploy).

Nenhum teste faz chamada de rede: `requests` é sempre mockado.
"""
import io
from unittest import mock

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from PIL import Image

from meta_integration import services
from meta_integration.models import MetaConnection, MetaPostLog
from noticias.models import CategoriaNoticia, Publicacao


def imagem_valida(nome="foto.jpg"):
    buffer = io.BytesIO()
    Image.new("RGB", (900, 900), (120, 90, 60)).save(buffer, "JPEG")
    return SimpleUploadedFile(nome, buffer.getvalue(), content_type="image/jpeg")


def fake_response(payload, status_code=200):
    """Resposta mínima compatível com o que o services usa de `requests`."""
    resp = mock.Mock()
    resp.status_code = status_code
    resp.json.return_value = payload
    resp.raise_for_status.return_value = None
    return resp


class MetaBaseTestCase(TestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(
            email="meta_qa@test.com", password="Senha123!", nome="QA Meta"
        )
        self.connection = MetaConnection.objects.create(
            user=self.user,
            page_id="PAGE123",
            page_name="ACAPRA Teste",
            page_access_token="token-secreto",
            instagram_id="IG123",
            is_active=True,
        )

    def criar_publicacao(self, titulo="Resgate de teste", com_foto=True):
        return Publicacao.objects.create(
            categoria=CategoriaNoticia.RESGATES,
            titulo=titulo,
            resumo="Resumo do resgate",
            texto="Texto completo da publicação.",
            foto=imagem_valida() if com_foto else "",
            ativo=True,
        )


class InstagramStoryTests(MetaBaseTestCase):
    """Story do Instagram: container com media_type=STORIES + espera + publish."""

    def test_ig_story_usa_media_type_stories(self):
        chamadas = []

        def fake_post(url, data=None, **kwargs):
            chamadas.append((url, data or {}))
            if url.endswith("/media"):
                return fake_response({"id": "CONTAINER1"})
            return fake_response({"id": "MEDIA_PUBLICADA"})

        with mock.patch.object(services.requests, "post", side_effect=fake_post), \
             mock.patch.object(services, "_esperar_container_pronto") as esperar:
            resultado = services._ig_story(self.connection, "https://acapra.org.br/api/media/x.jpg")

        url_container, data_container = chamadas[0]
        self.assertIn("/media", url_container)
        self.assertEqual(data_container.get("media_type"), "STORIES")
        # Story não leva legenda.
        self.assertNotIn("caption", data_container)
        # Precisa aguardar o processamento antes de publicar.
        esperar.assert_called_once()
        self.assertIn("/media_publish", chamadas[1][0])
        self.assertEqual(resultado, {"id": "MEDIA_PUBLICADA"})

    def test_ig_feed_envia_caption_e_nao_media_type(self):
        chamadas = []

        def fake_post(url, data=None, **kwargs):
            chamadas.append((url, data or {}))
            if url.endswith("/media"):
                return fake_response({"id": "CONTAINER2"})
            return fake_response({"id": "FEED_OK"})

        with mock.patch.object(services.requests, "post", side_effect=fake_post), \
             mock.patch.object(services, "_esperar_container_pronto"):
            services._ig_feed(self.connection, "https://acapra.org.br/api/media/x.jpg", "legenda")

        _, data_container = chamadas[0]
        self.assertEqual(data_container.get("caption"), "legenda")
        self.assertNotIn("media_type", data_container)


class FacebookStoryTests(MetaBaseTestCase):
    """Story do Facebook: upload não publicado -> /photo_stories."""

    def test_fb_story_sobe_foto_nao_publicada_e_cria_story(self):
        publicacao = self.criar_publicacao()
        caminho = services._framed_photo_path(publicacao, prefixo="pub")
        self.assertIsNotNone(caminho)

        chamadas = []

        def fake_post(url, data=None, files=None, **kwargs):
            chamadas.append((url, data or {}))
            if url.endswith("/photos"):
                return fake_response({"id": "PHOTO_ID"})
            return fake_response({"success": True})

        with mock.patch.object(services.requests, "post", side_effect=fake_post):
            services._fb_story(self.connection, caminho)

        url_upload, data_upload = chamadas[0]
        self.assertTrue(url_upload.endswith("/photos"))
        self.assertEqual(data_upload.get("published"), "false")

        url_story, data_story = chamadas[1]
        self.assertTrue(url_story.endswith("/photo_stories"))
        self.assertEqual(data_story.get("photo_id"), "PHOTO_ID")

    def test_fb_story_sem_arquivo_retorna_none(self):
        self.assertIsNone(services._fb_story(self.connection, None))


@override_settings(SITE_URL="https://acapra.org.br")
class UrlPublicaTests(MetaBaseTestCase):
    """A URL que o Instagram baixa precisa do prefixo /api (deploy sob sub-URI)."""

    def test_url_da_foto_moldurada_inclui_api(self):
        publicacao = self.criar_publicacao()
        caminho = services._framed_photo_path(publicacao, prefixo="pub")
        url = services._framed_public_url(caminho)
        self.assertIsNotNone(url)
        self.assertTrue(url.startswith("https://acapra.org.br/api/media/"), url)

    @override_settings(SITE_URL="http://localhost:8000")
    def test_url_local_nao_e_usada(self):
        publicacao = self.criar_publicacao()
        caminho = services._framed_photo_path(publicacao, prefixo="pub")
        self.assertIsNone(services._framed_public_url(caminho))


@override_settings(SITE_URL="https://acapra.org.br")
class AutoPostPublicacaoTests(MetaBaseTestCase):
    """auto_post_publicacao deve publicar feed + story no Facebook e Instagram."""

    def test_publica_feed_e_story_nas_duas_redes(self):
        publicacao = self.criar_publicacao()

        with mock.patch.object(services, "_fb_feed_photo") as fb_feed, \
             mock.patch.object(services, "_fb_story") as fb_story, \
             mock.patch.object(services, "_ig_feed") as ig_feed, \
             mock.patch.object(services, "_ig_story") as ig_story:
            services.auto_post_publicacao(publicacao)

        fb_feed.assert_called_once()
        fb_story.assert_called_once()
        ig_feed.assert_called_once()
        ig_story.assert_called_once()
        # Nada deu errado: nenhuma falha registrada.
        self.assertEqual(MetaPostLog.objects.count(), 0)

    def test_mensagem_da_publicacao_usa_titulo_e_resumo(self):
        publicacao = self.criar_publicacao(titulo="Mutirão de castração")
        mensagem = services.build_post_message_publicacao(publicacao)
        self.assertIn("Mutirão de castração", mensagem)
        self.assertIn("Resumo do resgate", mensagem)

    def test_sem_conexao_ativa_nao_publica(self):
        MetaConnection.objects.update(is_active=False)
        publicacao = self.criar_publicacao()

        with mock.patch.object(services, "_fb_feed_photo") as fb_feed, \
             mock.patch.object(services, "_ig_feed") as ig_feed:
            services.auto_post_publicacao(publicacao)

        fb_feed.assert_not_called()
        ig_feed.assert_not_called()

    def test_sem_instagram_id_registra_pulado(self):
        MetaConnection.objects.update(instagram_id="")
        publicacao = self.criar_publicacao()

        with mock.patch.object(services, "_fb_feed_photo"), \
             mock.patch.object(services, "_fb_story"), \
             mock.patch.object(services, "_ig_feed") as ig_feed:
            services.auto_post_publicacao(publicacao)

        ig_feed.assert_not_called()
        log = MetaPostLog.objects.get(rede="instagram")
        self.assertFalse(log.sucesso)
        self.assertIn("Pulado", log.detalhe)


@override_settings(SITE_URL="https://acapra.org.br")
class FalhasEIsolamentoTests(MetaBaseTestCase):
    """Uma falha numa rede não pode impedir as outras publicações."""

    def test_falha_no_facebook_nao_impede_instagram(self):
        publicacao = self.criar_publicacao()

        with mock.patch.object(services, "_fb_feed_photo", side_effect=RuntimeError("fb caiu")), \
             mock.patch.object(services, "_fb_story"), \
             mock.patch.object(services, "_ig_feed") as ig_feed, \
             mock.patch.object(services, "_ig_story"):
            services.auto_post_publicacao(publicacao)

        ig_feed.assert_called_once()
        log = MetaPostLog.objects.get(rede="facebook")
        self.assertIn("fb caiu", log.detalhe)

    def test_falha_de_story_e_marcada_no_detalhe(self):
        publicacao = self.criar_publicacao()

        with mock.patch.object(services, "_fb_feed_photo"), \
             mock.patch.object(services, "_fb_story"), \
             mock.patch.object(services, "_ig_feed"), \
             mock.patch.object(services, "_ig_story", side_effect=RuntimeError("story caiu")):
            services.auto_post_publicacao(publicacao)

        log = MetaPostLog.objects.get(rede="instagram")
        self.assertIn("[STORY]", log.detalhe)


@override_settings(SITE_URL="https://acapra.org.br")
class SelecaoFeedStoryTests(MetaBaseTestCase):
    """Feed e Story são selecionáveis de forma independente."""

    def _publicar(self, **kwargs):
        publicacao = self.criar_publicacao()
        with mock.patch.object(services, "_fb_feed_photo") as fb_feed, \
             mock.patch.object(services, "_fb_story") as fb_story, \
             mock.patch.object(services, "_ig_feed") as ig_feed, \
             mock.patch.object(services, "_ig_story") as ig_story:
            services.auto_post_publicacao(publicacao, **kwargs)
        return fb_feed, fb_story, ig_feed, ig_story

    def test_somente_feed(self):
        fb_feed, fb_story, ig_feed, ig_story = self._publicar(feed=True, story=False)
        fb_feed.assert_called_once()
        ig_feed.assert_called_once()
        fb_story.assert_not_called()
        ig_story.assert_not_called()

    def test_somente_story(self):
        fb_feed, fb_story, ig_feed, ig_story = self._publicar(feed=False, story=True)
        fb_story.assert_called_once()
        ig_story.assert_called_once()
        fb_feed.assert_not_called()
        ig_feed.assert_not_called()

    def test_nenhum_destino_nao_publica_nada(self):
        fb_feed, fb_story, ig_feed, ig_story = self._publicar(feed=False, story=False)
        for mocked in (fb_feed, fb_story, ig_feed, ig_story):
            mocked.assert_not_called()

    def test_animal_tambem_aceita_selecao(self):
        from adocao.models import Animal

        animal = Animal.objects.create(
            nome_animal="Bidu", nome_doador="Doador", telefone="+5549999990000",
            especie="cachorro", sexo="macho", foto=imagem_valida(), disponivel=True,
        )
        with mock.patch.object(services, "_fb_feed_photo") as fb_feed, \
             mock.patch.object(services, "_fb_story") as fb_story, \
             mock.patch.object(services, "_ig_feed"), \
             mock.patch.object(services, "_ig_story"):
            services.auto_post_animal(animal, feed=False, story=True)

        fb_story.assert_called_once()
        fb_feed.assert_not_called()


class FlagsPublicacaoTests(TestCase):
    """Leitura das flags enviadas pelo formulário."""

    def test_default_publica_feed_e_story(self):
        self.assertEqual(services.flags_publicacao({}), (True, True, True))

    def test_publicar_redes_false_desliga_tudo(self):
        publicar, _, _ = services.flags_publicacao({"publicar_redes": "false"})
        self.assertFalse(publicar)

    def test_apenas_story_selecionado(self):
        publicar, feed, story = services.flags_publicacao(
            {"publicar_feed": "false", "publicar_story": "true"}
        )
        self.assertTrue(publicar)
        self.assertFalse(feed)
        self.assertTrue(story)

    def test_ambos_desmarcados_nao_publica(self):
        publicar, feed, story = services.flags_publicacao(
            {"publicar_feed": "false", "publicar_story": "false"}
        )
        self.assertFalse(publicar)
        self.assertFalse(feed)
        self.assertFalse(story)

    def test_aceita_variacoes_de_verdadeiro(self):
        for valor in ("true", "True", "1", "on", "yes"):
            publicar, feed, _ = services.flags_publicacao({"publicar_feed": valor})
            self.assertTrue(feed, valor)


class MetaPostLogTests(TestCase):
    """Log enxuto: só falhas, token redigido e poda automática."""

    def test_token_e_redigido(self):
        texto = services._redact_token("erro em url?access_token=SEGREDO123&x=1")
        self.assertNotIn("SEGREDO123", texto)
        self.assertIn("access_token=REDACTED", texto)

    def test_poda_mantem_apenas_o_limite(self):
        limite = services.LIMITE_LOGS_META
        for i in range(limite + 5):
            services._registrar_falha_meta(i, f"Item {i}", "instagram", f"erro {i}")

        self.assertEqual(MetaPostLog.objects.count(), limite)
        # As mais recentes é que sobrevivem.
        self.assertTrue(
            MetaPostLog.objects.filter(animal_nome=f"Item {limite + 4}").exists()
        )
        self.assertFalse(MetaPostLog.objects.filter(animal_nome="Item 0").exists())

    def test_registro_grava_como_falha(self):
        services._registrar_falha_meta(1, "Bidu", "facebook", "algum erro")
        log = MetaPostLog.objects.get()
        self.assertFalse(log.sucesso)
        self.assertEqual(log.rede, "facebook")
        self.assertEqual(log.animal_nome, "Bidu")
