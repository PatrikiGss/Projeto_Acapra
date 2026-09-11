from django.core.cache import cache
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIRequestFactory, APITestCase
from .models import PerfilAdministrativo, Usuario
from .serializers import AtualizarPerfilAdministrativoSerializer


class UsuarioAPITestCase(APITestCase):
    """
    Testes de integração cobrindo fluxo principal da API de usuários:
    registro, autenticação JWT, acesso protegido e troca de senha.
    """

    def setUp(self):
        # Zera o histórico de rate limiting (throttling) entre os testes,
        # já que o cache é compartilhado no mesmo processo de teste.
        cache.clear()

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


class EscalonamentoPerfilAdminTestCase(APITestCase):
    """
    Garante que um diretor não consegue se trancar para fora do painel
    (auto-rebaixamento / autodesativação) e que o último diretor ativo do
    sistema não pode ser rebaixado/desativado.
    """

    def setUp(self):
        cache.clear()

        self.diretor = Usuario.objects.create_user(
            email="diretor@email.com",
            password="SenhaForte123!",
            nome="Diretor",
            telefone="+5511988888888",
        )
        self._promover(self.diretor, PerfilAdministrativo.Nivel.DIRETOR_ACAPRA)

        self.login_url = reverse('gerenciamento:login')

    def _promover(self, usuario, nivel, ativo=True):
        perfil = usuario.perfil_admin
        perfil.nivel = nivel
        perfil.ativo = ativo
        perfil.save()
        return perfil

    def _autenticar(self, email, senha="SenhaForte123!"):
        response = self.client.post(self.login_url, {"email": email, "password": senha})
        token = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

    def _perfil_url(self, usuario):
        return reverse('gerenciamento:admin_perfil_update', kwargs={'pk': usuario.pk})

    def test_diretor_nao_pode_se_rebaixar_para_nivel_intermediario(self):
        self._autenticar("diretor@email.com")

        response = self.client.patch(
            self._perfil_url(self.diretor),
            {"nivel": PerfilAdministrativo.Nivel.AUXILIAR_GERAL},
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.diretor.perfil_admin.refresh_from_db()
        self.assertEqual(
            self.diretor.perfil_admin.nivel,
            PerfilAdministrativo.Nivel.DIRETOR_ACAPRA,
        )

    def test_diretor_nao_pode_se_autodesativar(self):
        self._autenticar("diretor@email.com")

        response = self.client.patch(
            self._perfil_url(self.diretor),
            {"ativo": False},
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.diretor.perfil_admin.refresh_from_db()
        self.assertTrue(self.diretor.perfil_admin.ativo)

    def test_diretor_pode_rebaixar_outro_diretor_quando_ha_mais_de_um(self):
        outro = Usuario.objects.create_user(
            email="diretor2@email.com",
            password="SenhaForte123!",
            nome="Diretor 2",
            telefone="+5511977777777",
        )
        self._promover(outro, PerfilAdministrativo.Nivel.DIRETOR_ACAPRA)

        self._autenticar("diretor@email.com")

        response = self.client.patch(
            self._perfil_url(outro),
            {"nivel": PerfilAdministrativo.Nivel.ADMIN},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        outro.perfil_admin.refresh_from_db()
        self.assertEqual(
            outro.perfil_admin.nivel,
            PerfilAdministrativo.Nivel.ADMIN,
        )

    def test_nao_pode_rebaixar_ultimo_diretor_via_serializer(self):
        # A guarda do "último diretor" é defesa em profundidade no serializer:
        # via API ela coincide com a autoproteção (só um diretor acessa a rota),
        # então validamos diretamente, simulando um ator que não é o alvo.
        ator = Usuario.objects.create_user(
            email="ator@email.com",
            password="SenhaForte123!",
            nome="Ator",
            telefone="+5511966666666",
        )
        request = APIRequestFactory().patch("/")
        request.user = ator

        serializer = AtualizarPerfilAdministrativoSerializer(
            instance=self.diretor.perfil_admin,
            data={"nivel": PerfilAdministrativo.Nivel.ADMIN},
            partial=True,
            context={"request": request},
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("último diretor", str(serializer.errors).lower())