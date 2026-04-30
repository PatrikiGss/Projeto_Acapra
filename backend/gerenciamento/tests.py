from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from .models import Usuario


class UsuarioAPITestCase(APITestCase):
    """
    Testes de integração cobrindo fluxo principal da API de usuários:
    registro, autenticação JWT, acesso protegido e troca de senha.
    """

    def setUp(self):
        # Usuário base usado na maioria dos testes
        self.user = Usuario.objects.create_user(
            email="teste@email.com",
            password="12345678",
            nome="Teste"
        )

        # Endpoints principais da aplicação
        self.register_url = reverse('gerenciamento:register')
        self.login_url = reverse('gerenciamento:login')
        self.me_url = reverse('gerenciamento:me')
        self.change_password_url = reverse('gerenciamento:change_password')

    def test_register_user(self):
        """
        Garante que o registro cria usuário corretamente no banco.
        """

        data = {
            "email": "novo@email.com",
            "password": "SenhaForte123",
            "nome": "Novo Usuario",
            "telefone": "999999999"
        }

        response = self.client.post(self.register_url, data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Usuario.objects.count(), 2)
        self.assertEqual(Usuario.objects.last().email, "novo@email.com")

    def test_login_user(self):
        """
        Valida que login retorna tokens JWT válidos.
        """

        response = self.client.post(self.login_url, {
            "email": "teste@email.com",
            "password": "12345678"
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Tokens são obrigatórios para autenticação futura
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_get_me_authenticated(self):
        """
        Testa acesso autenticado ao endpoint /me.
        """

        # Obtém token válido via login
        login_response = self.client.post(self.login_url, {
            "email": "teste@email.com",
            "password": "12345678"
        })

        token = login_response.data['access']

        # Injeta token no header Authorization
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        response = self.client.get(self.me_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Deve retornar o próprio usuário autenticado
        self.assertEqual(response.data['email'], "teste@email.com")

    def test_change_password(self):
        """
        Garante que a troca de senha funciona e persiste corretamente.
        """

        login_response = self.client.post(self.login_url, {
            "email": "teste@email.com",
            "password": "12345678"
        })

        token = login_response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        response = self.client.post(self.change_password_url, {
            "old_password": "12345678",
            "new_password": "NovaSenha123"
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Recarrega do banco para validar alteração real
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("NovaSenha123"))

    def test_login_wrong_password(self):
        """
        Login deve falhar com senha incorreta.
        """

        response = self.client.post(self.login_url, {
            "email": "teste@email.com",
            "password": "senha_errada"
        })

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_access_me_without_token(self):
        """
        Endpoint protegido deve bloquear acesso sem autenticação.
        """

        response = self.client.get(self.me_url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_access_me_with_invalid_token(self):
        """
        Token inválido não deve ser aceito.
        """

        self.client.credentials(
            HTTP_AUTHORIZATION='Bearer token_fake_totalmente_inutil'
        )

        response = self.client.get(self.me_url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_change_password_wrong_old_password(self):
        """
        Não permite troca de senha com senha atual incorreta.
        """

        login_response = self.client.post(self.login_url, {
            "email": "teste@email.com",
            "password": "12345678"
        })

        token = login_response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        response = self.client.post(self.change_password_url, {
            "old_password": "errada",
            "new_password": "NovaSenha123"
        })

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_change_password_weak_password(self):
        """
        Deve rejeitar senha fraca conforme validações do Django.
        """

        login_response = self.client.post(self.login_url, {
            "email": "teste@email.com",
            "password": "12345678"
        })

        token = login_response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        response = self.client.post(self.change_password_url, {
            "old_password": "12345678",
            "new_password": "123"
        })

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)