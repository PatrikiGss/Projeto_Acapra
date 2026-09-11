"""
Testes automatizados de segurança do backend Django ACAPRA.

Cobrem:
  - rate limiting (login, registro, refresh);
  - criptografia transparente de tokens Meta;
  - validação segura de upload de arquivos;
  - permissões/controle de acesso (admin x usuário comum);
  - exposição de endpoints públicos x protegidos.
"""
import io
from unittest import mock

from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import connection
from django.test import RequestFactory, TestCase
from rest_framework import status
from rest_framework.test import APIClient

from core.captcha import get_client_ip
from core.crypto import decrypt_value, encrypt_value
from core.validators import validate_image_upload
from gerenciamento.models import PerfilAdministrativo, Usuario


def _png_bytes():
    from PIL import Image

    buf = io.BytesIO()
    Image.new("RGB", (2, 2), (120, 200, 80)).save(buf, format="PNG")
    return buf.getvalue()


PNG = _png_bytes()


def make_user(email="user@acapra.org", telefone="+5547988887777",
              password="Senha@Forte123", nivel=None):
    user = Usuario.objects.create_user(
        email=email, password=password, nome="Teste", telefone=telefone,
    )
    perfil = user.perfil_admin  # criado pelo signal post_save
    if nivel:
        perfil.nivel = nivel
        perfil.save()
    return user


class BaseSecurityTest(TestCase):
    def setUp(self):
        cache.clear()  # zera o histórico de throttling entre testes
        self.client = APIClient()

    def tearDown(self):
        cache.clear()


# ---------------------------------------------------------------------------
# RATE LIMITING
# ---------------------------------------------------------------------------
class LoginRateLimitTests(BaseSecurityTest):
    url = "/api/gerenciamento/auth/login/"

    def test_login_bloqueado_apos_5_tentativas(self):
        make_user(email="login@acapra.org", telefone="+5547988880001")
        payload = {"email": "login@acapra.org", "password": "errada"}

        codes = [self.client.post(self.url, payload).status_code for _ in range(6)]
        self.assertEqual(codes[-1], status.HTTP_429_TOO_MANY_REQUESTS)
        self.assertEqual(codes.count(status.HTTP_429_TOO_MANY_REQUESTS), 1)


class RegisterRateLimitTests(BaseSecurityTest):
    url = "/api/gerenciamento/auth/register/"

    def test_registro_bloqueado_apos_3_tentativas(self):
        codes = [self.client.post(self.url, {}).status_code for _ in range(4)]
        self.assertEqual(codes[-1], status.HTTP_429_TOO_MANY_REQUESTS)


class RefreshRateLimitTests(BaseSecurityTest):
    url = "/api/gerenciamento/auth/refresh/"

    def test_refresh_bloqueado_apos_10_tentativas(self):
        codes = [self.client.post(self.url, {"refresh": "x"}).status_code for _ in range(11)]
        self.assertEqual(codes[-1], status.HTTP_429_TOO_MANY_REQUESTS)


class ThrottleSpoofingTests(BaseSecurityTest):
    """
    Regressão para o bypass de rate limiting via X-Forwarded-For.

    Com NUM_PROXIES=0 (padrão), variar o header não deve criar "clientes"
    distintos: o throttle precisa continuar contando pelo IP real (REMOTE_ADDR)
    e bloquear na 6ª tentativa, mesmo com um XFF diferente a cada request.
    """

    url = "/api/gerenciamento/auth/login/"

    def test_xff_variavel_nao_burla_login(self):
        make_user(email="spoof@acapra.org", telefone="+5547988880009")
        payload = {"email": "spoof@acapra.org", "password": "errada"}

        codes = [
            self.client.post(
                self.url, payload, HTTP_X_FORWARDED_FOR=f"10.0.0.{i}"
            ).status_code
            for i in range(6)
        ]

        self.assertEqual(codes[-1], status.HTTP_429_TOO_MANY_REQUESTS)

    def test_xff_com_ip_real_anexado_nao_burla_login(self):
        # Simula proxy que anexa o IP real ao XFF forjado pelo cliente.
        make_user(email="spoof2@acapra.org", telefone="+5547988880010")
        payload = {"email": "spoof2@acapra.org", "password": "errada"}

        codes = [
            self.client.post(
                self.url, payload, HTTP_X_FORWARDED_FOR=f"10.0.0.{i}, 203.0.113.50"
            ).status_code
            for i in range(6)
        ]

        self.assertEqual(codes[-1], status.HTTP_429_TOO_MANY_REQUESTS)


class AccountLockoutTests(BaseSecurityTest):
    """
    Trava de login por CONTA (independente de IP): após N falhas a conta é
    bloqueada temporariamente, fechando o brute force que varia o IP.
    """

    def test_conta_bloqueia_apos_falhas_de_burst(self):
        from gerenciamento import login_guard

        email = "alvo@acapra.org"
        self.assertFalse(login_guard.conta_bloqueada(email))

        for _ in range(login_guard.ACCOUNT_FAIL_BURST):
            login_guard.registrar_falha(email)

        self.assertTrue(login_guard.conta_bloqueada(email))

    def test_login_correto_zera_o_contador(self):
        from gerenciamento import login_guard

        email = "alvo2@acapra.org"
        for _ in range(login_guard.ACCOUNT_FAIL_BURST - 1):
            login_guard.registrar_falha(email)

        login_guard.limpar_falhas(email)
        self.assertFalse(login_guard.conta_bloqueada(email))

    def test_email_vazio_nao_quebra(self):
        from gerenciamento import login_guard

        login_guard.registrar_falha("")
        self.assertFalse(login_guard.conta_bloqueada(""))

    def test_falhas_via_view_incrementam_contador(self):
        # Regressão: credenciais inválidas chegam como exceção 401, não como
        # Response. O contador precisa incrementar mesmo assim.
        make_user(email="real@acapra.org", telefone="+5547988880012",
                  password="Senha@Forte123")

        # 3 falhas (abaixo do limite por IP de 5/min, então todas chegam à view).
        for _ in range(3):
            self.client.post(
                "/api/gerenciamento/auth/login/",
                {"email": "real@acapra.org", "password": "errada"},
            )

        self.assertEqual(cache.get("login_fail_burst:real@acapra.org"), 3)

    def test_login_correto_via_view_zera_contador(self):
        make_user(email="real2@acapra.org", telefone="+5547988880013",
                  password="Senha@Forte123")
        self.client.post(
            "/api/gerenciamento/auth/login/",
            {"email": "real2@acapra.org", "password": "errada"},
        )
        self.assertEqual(cache.get("login_fail_burst:real2@acapra.org"), 1)

        # Login correto deve limpar o histórico de falhas.
        resp = self.client.post(
            "/api/gerenciamento/auth/login/",
            {"email": "real2@acapra.org", "password": "Senha@Forte123"},
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIsNone(cache.get("login_fail_burst:real2@acapra.org"))

    def test_view_retorna_429_quando_conta_bloqueada(self):
        from gerenciamento import login_guard

        make_user(email="locked@acapra.org", telefone="+5547988880011",
                  password="Senha@Forte123")
        # Pré-bloqueia a conta diretamente (evita esbarrar no throttle por IP).
        for _ in range(login_guard.ACCOUNT_FAIL_BURST):
            login_guard.registrar_falha("locked@acapra.org")

        resp = self.client.post(
            "/api/gerenciamento/auth/login/",
            {"email": "locked@acapra.org", "password": "Senha@Forte123"},
        )
        # Mesmo com a senha CORRETA, a conta bloqueada recebe 429.
        self.assertEqual(resp.status_code, status.HTTP_429_TOO_MANY_REQUESTS)


class ClientIPResolutionTests(BaseSecurityTest):
    """Resolução do IP real respeitando NUM_PROXIES (anti-spoofing)."""

    def setUp(self):
        super().setUp()
        self.factory = RequestFactory()

    def test_sem_proxy_ignora_xff(self):
        # NUM_PROXIES=0 (padrão): XFF forjado é descartado, usa REMOTE_ADDR.
        req = self.factory.post(
            "/", HTTP_X_FORWARDED_FOR="1.2.3.4", REMOTE_ADDR="203.0.113.9"
        )
        self.assertEqual(get_client_ip(req), "203.0.113.9")

    @mock.patch("core.captcha._num_proxies", return_value=1)
    def test_atras_de_proxy_usa_ip_inserido_pelo_proxy(self, _):
        # Atrás de 1 proxy: usa o último IP do XFF (inserido pelo proxy),
        # ignorando o prefixo forjado pelo cliente.
        req = self.factory.post(
            "/",
            HTTP_X_FORWARDED_FOR="1.2.3.4, 203.0.113.50",
            REMOTE_ADDR="10.0.0.1",
        )
        self.assertEqual(get_client_ip(req), "203.0.113.50")


# ---------------------------------------------------------------------------
# CRIPTOGRAFIA DE TOKENS META
# ---------------------------------------------------------------------------
class EncryptionTests(BaseSecurityTest):
    def test_roundtrip(self):
        c = encrypt_value("EAAB_token")
        self.assertNotEqual(c, "EAAB_token")
        self.assertEqual(decrypt_value(c), "EAAB_token")

    def test_compatibilidade_legado_texto_plano(self):
        self.assertEqual(decrypt_value("token_legado"), "token_legado")

    def test_token_armazenado_cifrado_no_banco(self):
        from meta_integration.models import MetaConnection

        user = make_user(email="meta@acapra.org", telefone="+5547988880002")
        MetaConnection.objects.create(
            user=user,
            page_id="123",
            page_name="Pagina",
            page_access_token="TOKEN_SECRETO_123",
        )

        with connection.cursor() as cur:
            cur.execute(
                "SELECT page_access_token FROM meta_integration_metaconnection LIMIT 1"
            )
            raw = cur.fetchone()[0]

        self.assertNotIn("TOKEN_SECRETO_123", raw)
        self.assertTrue(raw.startswith("gAAAAA"))  # prefixo Fernet

        obj = MetaConnection.objects.first()
        self.assertEqual(obj.page_access_token, "TOKEN_SECRETO_123")

    def test_token_nao_exposto_no_status_endpoint(self):
        from meta_integration.models import MetaConnection

        user = make_user(email="meta2@acapra.org", telefone="+5547988880003")
        MetaConnection.objects.create(
            user=user, page_id="1", page_name="P",
            page_access_token="NAO_DEVE_VAZAR",
        )
        self.client.force_authenticate(user=user)
        resp = self.client.get("/api/meta/status/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        body = resp.content.decode()
        self.assertNotIn("NAO_DEVE_VAZAR", body)
        self.assertNotIn("access_token", body)


# ---------------------------------------------------------------------------
# VALIDAÇÃO DE UPLOAD
# ---------------------------------------------------------------------------
class UploadValidationTests(BaseSecurityTest):
    def test_rejeita_extensao_executavel(self):
        f = SimpleUploadedFile("shell.php", PNG, content_type="image/png")
        with self.assertRaises(ValidationError):
            validate_image_upload(f)

    def test_rejeita_conteudo_incompativel_com_extensao(self):
        f = SimpleUploadedFile("fake.png", b"<?php echo 1; ?>", content_type="image/png")
        with self.assertRaises(ValidationError):
            validate_image_upload(f)

    def test_rejeita_arquivo_grande(self):
        big = SimpleUploadedFile(
            "big.png", PNG + b"0" * (6 * 1024 * 1024), content_type="image/png"
        )
        big.size = 6 * 1024 * 1024
        with self.assertRaises(ValidationError):
            validate_image_upload(big)

    def test_aceita_imagem_valida(self):
        f = SimpleUploadedFile("ok.png", PNG, content_type="image/png")
        try:
            validate_image_upload(f)
        except ValidationError:
            self.fail("Imagem PNG válida foi rejeitada indevidamente.")


# ---------------------------------------------------------------------------
# CONTROLE DE ACESSO / PERMISSÕES
# ---------------------------------------------------------------------------
class AccessControlTests(BaseSecurityTest):
    admin_url = "/api/gerenciamento/admin/usuarios/"

    def test_usuario_comum_nao_acessa_admin(self):
        user = make_user(email="comum@acapra.org", telefone="+5547988880004")
        self.client.force_authenticate(user=user)
        resp = self.client.get(self.admin_url)
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_master_acessa_admin(self):
        master = make_user(
            email="master@acapra.org", telefone="+5547988880005",
            nivel=PerfilAdministrativo.Nivel.DIRETOR_ACAPRA,
        )
        self.client.force_authenticate(user=master)
        resp = self.client.get(self.admin_url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_admin_sem_autenticacao_nega(self):
        resp = self.client.get(self.admin_url)
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)


# ---------------------------------------------------------------------------
# ENDPOINTS PÚBLICOS x PROTEGIDOS
# ---------------------------------------------------------------------------
class PublicEndpointTests(BaseSecurityTest):
    def test_denuncia_publica_pode_ser_criada(self):
        resp = self.client.post(
            "/api/denuncias/denuncias/",
            {"titulo": "Caso", "descricao": "Descrição do caso",
             "gravidade": "baixo"},
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_listagem_de_denuncias_exige_autenticacao(self):
        resp = self.client.get("/api/denuncias/denuncias/")
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_listagem_de_voluntarios_exige_autenticacao(self):
        resp = self.client.get("/api/voluntariado/voluntarios/")
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)
