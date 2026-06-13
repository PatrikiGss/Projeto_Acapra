"""
Testes automatizados para o app `contato`.

O app expõe um único registro de configuração (singleton ContatoAcapra)
com os canais de contato da ACAPRA, lido publicamente e editável apenas
pelo Diretor.
"""

from django.apps import apps
from django.test import TestCase

from contato.models import ContatoAcapra


class ContatoAppConfigTests(TestCase):
    """Testes para a configuração do app `contato`."""

    def test_app_is_installed(self):
        """O app deve estar listado no INSTALLED_APPS."""
        self.assertTrue(apps.is_installed("contato"))


class ContatoModelTests(TestCase):
    """Testes do model singleton `ContatoAcapra`."""

    def test_get_instance_retorna_singleton(self):
        """get_instance() sempre retorna o mesmo registro (pk=1)."""
        primeiro = ContatoAcapra.get_instance()
        segundo = ContatoAcapra.get_instance()

        self.assertEqual(primeiro.pk, 1)
        self.assertEqual(primeiro.pk, segundo.pk)
        self.assertEqual(ContatoAcapra.objects.count(), 1)

    def test_save_forca_pk_unico(self):
        """Qualquer save() é forçado para pk=1, garantindo um só registro."""
        contato = ContatoAcapra(email="acapra@example.com")
        contato.save()

        self.assertEqual(contato.pk, 1)
        self.assertEqual(ContatoAcapra.objects.count(), 1)
