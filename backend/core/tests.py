"""
Testes automatizados para o app `core`.

Cobre:
- View `home`: retorno JSON, status HTTP 200, conteúdo esperado.
- Acesso público (AllowAny) sem autenticação.
- Métodos HTTP não permitidos (POST, PUT, DELETE).
- Resolução de URL pelo namespace `core:home`.
"""

from django.test import TestCase
from django.urls import reverse, resolve
from rest_framework import status
from rest_framework.test import APIClient

from core import views


class HomeViewTests(TestCase):
    """Testes para o endpoint `home` em /api/core/."""

    def setUp(self):
        self.client = APIClient()
        self.url = reverse("core:home")

    def test_home_endpoint_status_code(self):
        """GET / deve retornar 200 OK."""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_home_endpoint_payload(self):
        """O conteúdo deve indicar que a API está online."""
        response = self.client.get(self.url)
        self.assertEqual(response.data.get("status"), "online")
        self.assertEqual(response.data.get("message"), "API ACAPRA funcionando")

    def test_home_endpoint_returns_json(self):
        """A resposta deve ser JSON."""
        response = self.client.get(self.url)
        self.assertEqual(response["Content-Type"], "application/json")

    def test_home_endpoint_allow_any(self):
        """Endpoint deve ser acessível sem autenticação (AllowAny)."""
        # Sem credenciais
        self.client.credentials()
        response = self.client.get(self.url)
        self.assertNotEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertNotEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_home_does_not_accept_post(self):
        """POST não é permitido em /api/core/."""
        response = self.client.post(self.url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_home_does_not_accept_put(self):
        """PUT não é permitido em /api/core/."""
        response = self.client.put(self.url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_home_does_not_accept_delete(self):
        """DELETE não é permitido em /api/core/."""
        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)


class CoreUrlResolutionTests(TestCase):
    """Garante que o roteamento do app está corretamente registrado."""

    def test_reverse_home_url(self):
        """O nome `core:home` deve resolver para /api/core/."""
        self.assertEqual(reverse("core:home"), "/api/core/")

    def test_home_url_resolves_to_view(self):
        """A URL /api/core/ deve resolver para a view `home`."""
        match = resolve("/api/core/")
        self.assertEqual(match.func, views.home)
        self.assertEqual(match.namespace, "core")
        self.assertEqual(match.url_name, "home")
