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
            password="SenhaForte123!",
            nome="Teste",
            telefone="+5511999999999"
        )

        # Endpoints principais da aplicação
        self.register_url = reverse('gerenciamento:register')
        self.login_url = reverse('gerenciamento:login')
        self.me_url = reverse('gerenciamento:me')
        self.change_password_url = reverse('gerenciamento:change_password')

    def test_register_user(self):
        data = {
            "email": "novo@email.com",
            "password": "SenhaForte123!",
            "nome": "Novo Usuario",
            "telefone": "+5511977777777"
        }

        response = self.client.post(self.register_url, data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Usuario.objects.count(), 2)
        self.assertEqual(Usuario.objects.last().email, "novo@email.com")

    def test_login_user(self):
        response = self.client.post(self.login_url, {
            "email": "teste@email.com",
            "password": "SenhaForte123!"
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_get_me_authenticated(self):
        login_response = self.client.post(self.login_url, {
            "email": "teste@email.com",
            "password": "SenhaForte123!"
        })

        token = login_response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        response = self.client.get(self.me_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], "teste@email.com")

    def test_change_password(self):
        login_response = self.client.post(self.login_url, {
            "email": "teste@email.com",
            "password": "SenhaForte123!"
        })

        token = login_response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        response = self.client.post(self.change_password_url, {
            "old_password": "SenhaForte123!",
            "new_password": "NovaSenha123@"
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("NovaSenha123@"))

    def test_login_wrong_password(self):
        response = self.client.post(self.login_url, {
            "email": "teste@email.com",
            "password": "senha_errada"
        })

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_access_me_without_token(self):
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_access_me_with_invalid_token(self):
        self.client.credentials(
            HTTP_AUTHORIZATION='Bearer token_fake_totalmente_inutil'
        )

        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_change_password_wrong_old_password(self):
        login_response = self.client.post(self.login_url, {
            "email": "teste@email.com",
            "password": "SenhaForte123!"
        })

        token = login_response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        response = self.client.post(self.change_password_url, {
            "old_password": "errada",
            "new_password": "NovaSenha123@"
        })

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_change_password_weak_password(self):
        login_response = self.client.post(self.login_url, {
            "email": "teste@email.com",
            "password": "SenhaForte123!"
        })

        token = login_response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        response = self.client.post(self.change_password_url, {
            "old_password": "SenhaForte123!",
            "new_password": "123"
        })

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


    def test_register_duplicate_email(self):
        data = {
            "email": "teste@email.com",
            "password": "SenhaForte123!",
            "nome": "Outro"
        }

        response = self.client.post(self.register_url, data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_without_email(self):
        data = {
            "password": "SenhaForte123!",
            "nome": "Sem Email"
        }

        response = self.client.post(self.register_url, data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        
    def test_perfil_admin_created_automatically(self):
            user = Usuario.objects.create_user(
                 email="novo2@email.com",
                 password="SenhaForte123!",
                 nome="Outro",
                 telefone="+5511966666666"
        )

            self.assertTrue(hasattr(user, "perfil_admin"))
            self.assertEqual(user.perfil_admin.nivel, "usuario")
            
    def test_cannot_update_email(self):
        login_response = self.client.post(self.login_url, {
            "email": "teste@email.com",
            "password": "SenhaForte123!"
        })

        token = login_response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        response = self.client.patch(self.me_url, {
            "email": "hack@email.com"
        })

        self.assertNotIn("email", response.data)
        
    def test_change_password_same_as_old(self):
         login_response = self.client.post(self.login_url, {
             "email": "teste@email.com",
             "password": "SenhaForte123!"
         })

         token = login_response.data['access']
         self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

         response = self.client.post(self.change_password_url, {
             "old_password": "SenhaForte123!",
             "new_password": "SenhaForte123!"
         })

         self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)