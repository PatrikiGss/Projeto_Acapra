"""
Testes automatizados para o app `transparencia`.

O app expõe documentos institucionais e indicadores de impacto. Estes testes
cobrem a configuração do app, o registro dos models e a resolução das rotas.
Cada CRUD deve ganhar cobertura própria conforme evoluir.
"""

from django.apps import apps
from django.test import TestCase
from django.urls import reverse

from transparencia.apps import TransparenciaConfig


class TransparenciaAppConfigTests(TestCase):
    """Testes para a configuração do app `transparencia`."""

    def test_app_is_installed(self):
        """O app deve estar listado no INSTALLED_APPS."""
        self.assertTrue(apps.is_installed("transparencia"))

    def test_app_config_name(self):
        """O AppConfig deve apontar para o nome `transparencia`."""
        self.assertEqual(TransparenciaConfig.name, "transparencia")


class TransparenciaUrlsTests(TestCase):
    """Testes para o módulo de URLs do app."""

    def test_urls_module_importable(self):
        """O módulo `transparencia.urls` deve ser importável com namespace."""
        from transparencia import urls
        self.assertEqual(urls.app_name, "transparencia")

    def test_rotas_principais_resolvem(self):
        """As rotas de listagem do app devem resolver corretamente."""
        self.assertTrue(reverse("transparencia:documentos"))
        self.assertTrue(reverse("transparencia:indicadores"))


class TransparenciaModelsTests(TestCase):
    """Testes para o registro dos models do app."""

    def test_models_registrados(self):
        """Os models do app devem estar registrados no registry do Django."""
        registrados = {
            model.__name__
            for model in apps.get_app_config("transparencia").get_models()
        }
        esperados = {"DocumentoInstitucional", "Indicador"}
        self.assertTrue(esperados.issubset(registrados))
