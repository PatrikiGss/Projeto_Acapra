"""
Testes automatizados para o app `denuncias`.

O app está atualmente sem models, views e serializers (apenas placeholders).
Os testes garantem que:

- O app está corretamente registrado no INSTALLED_APPS.
- O `AppConfig` (DenunciasConfig) carrega normalmente.
- O módulo de URLs do app é importável e tem namespace correto.
- A configuração não quebra a coleta automática de URLs.

Quando models/views forem adicionados, novos testes devem cobrir cada CRUD.
"""

from django.apps import apps
from django.test import TestCase
from django.urls import NoReverseMatch, reverse

from denuncias.apps import DenunciasConfig


class DenunciasAppConfigTests(TestCase):
    """Testes para a configuração do app `denuncias`."""

    def test_app_is_installed(self):
        """O app deve estar listado no INSTALLED_APPS."""
        self.assertTrue(apps.is_installed("denuncias"))

    def test_app_config_name(self):
        """O AppConfig deve apontar para o nome `denuncias`."""
        self.assertEqual(DenunciasConfig.name, "denuncias")

    def test_app_config_resolves_via_apps_registry(self):
        """O registry do Django deve resolver o app pelo label."""
        app_config = apps.get_app_config("denuncias")
        self.assertEqual(app_config.name, "denuncias")


class DenunciasUrlsTests(TestCase):
    """Testes para o módulo de URLs do app."""

    def test_urls_module_importable(self):
        """O módulo `denuncias.urls` deve ser importável sem erros."""
        from denuncias import urls
        self.assertEqual(urls.app_name, "denuncias")

    def test_urlpatterns_is_a_list(self):
        """A variável `urlpatterns` deve ser uma lista (mesmo que vazia)."""
        from denuncias import urls
        self.assertIsInstance(urls.urlpatterns, list)

    def test_no_routes_registered_yet(self):
        """
        Como nenhuma rota foi adicionada ainda, qualquer reverse
        para um nome arbitrário do namespace deve falhar.
        """
        with self.assertRaises(NoReverseMatch):
            reverse("denuncias:lista")


class DenunciasModelsTests(TestCase):
    """Testes para módulo de models (atualmente vazio)."""

    def test_models_module_importable(self):
        """O módulo `denuncias.models` deve ser importável."""
        from denuncias import models  # noqa: F401

    def test_no_models_registered_yet(self):
        """Nenhum model do app `denuncias` deve estar registrado."""
        app_models = apps.get_app_config("denuncias").get_models()
        self.assertEqual(list(app_models), [])


class DenunciasViewsTests(TestCase):
    """Testes para módulo de views (atualmente vazio)."""

    def test_views_module_importable(self):
        """O módulo `denuncias.views` deve ser importável."""
        from denuncias import views  # noqa: F401
