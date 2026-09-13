"""
Rotas de mídia do `Acapra/urls.py`.

As rotas são montadas na importação do módulo conforme DEBUG/SERVE_MEDIA, por
isso cada teste recarrega o urlconf com as settings desejadas.
"""
import importlib
import tempfile
from pathlib import Path

from django.test import TestCase, override_settings
from django.urls import Resolver404, clear_url_caches, resolve
from django.views.static import serve

import Acapra.urls


class RotasDeMidiaTests(TestCase):
    def recarregar_urls(self):
        clear_url_caches()
        return importlib.reload(Acapra.urls)

    def tearDown(self):
        # Volta o urlconf ao estado das settings normais de teste.
        self.recarregar_urls()

    @override_settings(DEBUG=False, SERVE_MEDIA=True)
    def test_producao_resolve_api_media_e_media(self):
        urls = self.recarregar_urls()

        for caminho in ("/api/media/fotos/a.webp", "/media/fotos/a.webp"):
            match = resolve(caminho, urlconf=urls)
            self.assertIs(match.func, serve)
            self.assertEqual(match.kwargs["path"], "fotos/a.webp")

    @override_settings(DEBUG=False, SERVE_MEDIA=False)
    def test_sem_serve_media_os_uploads_nao_ficam_expostos(self):
        urls = self.recarregar_urls()

        for caminho in ("/api/media/fotos/a.webp", "/media/fotos/a.webp"):
            with self.assertRaises(Resolver404):
                resolve(caminho, urlconf=urls)

    def test_producao_entrega_o_arquivo_pelas_duas_rotas(self):
        with tempfile.TemporaryDirectory() as pasta:
            (Path(pasta) / "fotos").mkdir()
            (Path(pasta) / "fotos" / "a.webp").write_bytes(b"conteudo-da-foto")

            with override_settings(DEBUG=False, SERVE_MEDIA=True, MEDIA_ROOT=pasta):
                self.recarregar_urls()

                for caminho in ("/api/media/fotos/a.webp", "/media/fotos/a.webp"):
                    resposta = self.client.get(caminho)
                    self.assertEqual(resposta.status_code, 200)
                    self.assertEqual(b"".join(resposta.streaming_content), b"conteudo-da-foto")
                    resposta.close()
