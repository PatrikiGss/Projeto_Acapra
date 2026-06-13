"""
Testes do app `auditoria`.

Cobrem o registro de eventos, a imutabilidade da trilha e o acesso
restrito ao Diretor na listagem.
"""
from types import SimpleNamespace

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from auditoria.models import RegistroAuditoria
from auditoria.services import registrar_auditoria
from gerenciamento.models import PerfilAdministrativo, Usuario


def make_user(email, telefone, nivel=PerfilAdministrativo.Nivel.USUARIO):
    user = Usuario.objects.create_user(
        email=email,
        password="Senh@F0rte!2026",
        nome="Teste",
        telefone=telefone,
    )
    perfil = user.perfil_admin
    perfil.nivel = nivel
    perfil.save(update_fields=["nivel"])
    return user


class RegistroAuditoriaModelTests(TestCase):
    def setUp(self):
        self.user = make_user("autor@acapra.org", "+5511999999999")

    def test_registrar_cria_registro_com_quem_e_quando(self):
        request = SimpleNamespace(user=self.user)
        registrar_auditoria(request, self.user, RegistroAuditoria.Acao.CRIADO)

        registro = RegistroAuditoria.objects.get()
        self.assertEqual(registro.acao, RegistroAuditoria.Acao.CRIADO)
        self.assertEqual(registro.modelo, "Usuario")
        self.assertEqual(registro.objeto_id, str(self.user.pk))
        self.assertEqual(registro.usuario, self.user)
        self.assertEqual(registro.usuario_email, self.user.email)
        self.assertIsNotNone(registro.data_hora)

    def test_registro_nao_pode_ser_editado(self):
        registro = RegistroAuditoria.objects.create(
            acao=RegistroAuditoria.Acao.CRIADO, modelo="DadosPix"
        )
        registro.descricao = "tentativa de alteração"
        with self.assertRaises(ValueError):
            registro.save()

    def test_registro_nao_pode_ser_excluido(self):
        registro = RegistroAuditoria.objects.create(
            acao=RegistroAuditoria.Acao.CRIADO, modelo="DadosPix"
        )
        with self.assertRaises(ValueError):
            registro.delete()


class RegistrosAuditoriaViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = "/api/auditoria/registros/"
        RegistroAuditoria.objects.create(
            acao=RegistroAuditoria.Acao.CRIADO, modelo="DadosPix"
        )

    def test_lista_exige_autenticacao(self):
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_usuario_comum_nao_acessa(self):
        self.client.force_authenticate(user=make_user("comum@acapra.org", "+5511988888888"))
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_diretor_acessa(self):
        diretor = make_user(
            "diretor@acapra.org",
            "+5511977777777",
            PerfilAdministrativo.Nivel.DIRETOR_ACAPRA,
        )
        self.client.force_authenticate(user=diretor)
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
