import hashlib
import secrets
from datetime import timedelta

from django.core.mail import send_mail
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.exceptions import APIException
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.permissions import AllowAny
from .models import PasswordResetToken, Usuario
from .models import Usuario
from .permissions import (
    IsDiretor,
    TemAcessoDashboard,
    get_modulos_usuario,
    get_nivel_usuario,
)
from .serializers import (
    AdminUsuarioSerializer,
    AtualizarPerfilAdministrativoSerializer,
    ChangePasswordSerializer,
    GetUsuarioSerializer,
    UpdateUsuarioSerializer,
    UsuarioSerializer,
)
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from auditoria.models import RegistroAuditoria
from auditoria.services import registrar_auditoria
from core.captcha import get_client_ip
from core.throttling import (
    LoginDailyRateThrottle,
    LoginRateThrottle,
    PasswordResetRateThrottle,
    RefreshRateThrottle,
    RegisterDailyRateThrottle,
    RegisterRateThrottle,
)
from .login_guard import conta_bloqueada, limpar_falhas, registrar_falha


class ThrottledLoginView(TokenObtainPairView):
    """
    Login JWT com defesa em camadas contra brute force:
      - por IP: rajada (5/min) + teto diário (100/dia);
      - por conta: trava temporária após falhas (independente de IP),
        fechando ataques que variam o IP de origem.
    """
    throttle_classes = [LoginRateThrottle, LoginDailyRateThrottle]

    def post(self, request, *args, **kwargs):
        email = request.data.get("email", "")

        # Bloqueio por conta: barra antes mesmo de verificar a senha.
        if conta_bloqueada(email):
            return Response(
                {"detail": "Muitas tentativas de login para esta conta. "
                           "Tente novamente mais tarde."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        # Credenciais inválidas chegam como exceção 401 (AuthenticationFailed),
        # não como Response — por isso o registro de falha precisa cobrir os
        # dois caminhos (exceção e response).
        try:
            response = super().post(request, *args, **kwargs)
        except APIException as exc:
            if getattr(exc, "status_code", None) == status.HTTP_401_UNAUTHORIZED:
                registrar_falha(email)
            raise

        if response.status_code == status.HTTP_200_OK:
            # Sucesso zera o histórico de falhas da conta.
            limpar_falhas(email)
        elif response.status_code == status.HTTP_401_UNAUTHORIZED:
            registrar_falha(email)

        return response


class ThrottledRefreshView(TokenRefreshView):
    """Refresh de token com rate limiting por IP (10/min)."""
    throttle_classes = [RefreshRateThrottle]


class RegisterView(APIView):
    permission_classes = [AllowAny]
    # Rajada (3/min) + teto diário (20/dia) por IP, ambos precisam passar.
    throttle_classes = [RegisterRateThrottle, RegisterDailyRateThrottle]
    """
    Endpoint público para registro de novos usuários.

    Fluxo:
    - Recebe dados (nome, email, telefone, senha)
    - Valida via serializer
    - Cria usuário usando create_user (hash automático da senha)
    - Retorna dados do usuário (sem senha)

    Proteção contra automação fica a cargo do throttling por IP
    (RegisterRateThrottle + RegisterDailyRateThrottle).
    """

    def post(self, request):
        serializer = UsuarioSerializer(data=request.data)

        # Valida dados recebidos (gera erro automático se inválido)
        serializer.is_valid(raise_exception=True)

        # Cria usuário no banco
        serializer.save()

        # Retorna dados do usuário criado
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class MeuPerfilView(APIView):
    """
    Endpoint para gerenciamento do próprio perfil.

    Requer autenticação (JWT).

    GET:
    - Retorna dados do usuário autenticado

    PUT:
    - Atualiza dados básicos (nome, email, telefone)
    - Não altera senha (rota separada)
    """

    # Só usuários autenticados podem acessar
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Retorna dados do usuário logado.

        Observação:
        request.user já vem do middleware de autenticação (JWT).
        """
        serializer = GetUsuarioSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        """
        Atualiza parcialmente os dados do usuário logado.

        partial=True permite atualizar apenas os campos enviados.
        """
        serializer = UpdateUsuarioSerializer(
            request.user,
            data=request.data,
            partial=True
        )

        serializer.is_valid(raise_exception=True)

        # Salva alterações no usuário
        serializer.save()

        return Response(serializer.data)


class ChangePasswordView(APIView):
    """
    Endpoint para alteração de senha do usuário autenticado.

    Regras:
    - Deve informar senha atual
    - Nova senha passa pelas validações do Django
    - Nova senha deve ser diferente da atual

    Segurança:
    - Usa set_password (hash seguro)
    - Mantém sessão ativa com update_session_auth_hash
    """

    permission_classes = [IsAuthenticated]
    throttle_classes = [PasswordResetRateThrottle]

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={'request': request}  # necessário para validar senha atual
        )

        # Valida dados (senha atual + nova senha)
        serializer.is_valid(raise_exception=True)

        user = request.user

        # Atualiza senha com hash seguro (NUNCA salvar senha pura)
        user.set_password(serializer.validated_data['new_password'])
        user.save()

        # Invalida TODOS os tokens do usuário
        for token in OutstandingToken.objects.filter(user=user):
            BlacklistedToken.objects.get_or_create(token=token)

        user.save()

        return Response(
            {"detail": "Senha alterada com sucesso."},
            status=status.HTTP_200_OK,
        )


class DashboardView(APIView):
    permission_classes = [IsAuthenticated, TemAcessoDashboard]

    def get(self, request):
        from adocao.models import Animal
        from doacoes.models import DadosPix
        from noticias.models import Publicacao
        from vendas.models import Produto
        from voluntariado.models import Voluntario

        nivel = get_nivel_usuario(request.user)
        modulos = get_modulos_usuario(request.user)

        # As estatísticas seguem os módulos liberados para o nível do usuário,
        # mantendo o painel sempre coerente com MODULOS_POR_NIVEL.
        estatisticas = {}
        if "gerenciamento_usuarios" in modulos:
            estatisticas["usuarios"] = Usuario.objects.count()
        if "adocao" in modulos:
            estatisticas["animais"] = Animal.objects.count()
        if "noticias" in modulos:
            estatisticas["publicacoes"] = Publicacao.objects.count()
        if "vendas" in modulos:
            estatisticas["produtos"] = Produto.objects.count()
        if "doacoes" in modulos:
            estatisticas["dados_pix"] = DadosPix.objects.count()
        if "voluntariado" in modulos:
            estatisticas["voluntarios"] = Voluntario.objects.count()

        perfil = getattr(request.user, "perfil_admin", None)
        nivel_display = perfil.get_nivel_display() if perfil else "Usuário sem vínculo"

        return Response(
            {
                "usuario": GetUsuarioSerializer(request.user).data,
                "nivel": nivel,
                "nivel_display": nivel_display,
                "modulos": modulos,
                "estatisticas": estatisticas,
            }
        )


class AdminUsuariosView(APIView):
    permission_classes = [IsAuthenticated, IsDiretor]

    def get(self, request):
        usuarios = Usuario.objects.select_related("perfil_admin").order_by("nome")
        serializer = AdminUsuarioSerializer(usuarios, many=True)
        return Response(serializer.data)


class AdminPerfilUpdateView(APIView):
    permission_classes = [IsAuthenticated, IsDiretor]

    def patch(self, request, pk):
        usuario = get_object_or_404(
            Usuario.objects.select_related("perfil_admin"),
            pk=pk,
        )
        perfil = usuario.perfil_admin
        nivel_anterior = perfil.nivel
        ativo_anterior = perfil.ativo

        serializer = AtualizarPerfilAdministrativoSerializer(
            perfil,
            data=request.data,
            partial=True,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save(promovido_por=request.user)

        # Auditoria de mudança de permissionamento (crítico para segurança).
        alteracoes = {}
        if perfil.nivel != nivel_anterior:
            alteracoes["nivel"] = [nivel_anterior, perfil.nivel]
        if perfil.ativo != ativo_anterior:
            alteracoes["ativo"] = [ativo_anterior, perfil.ativo]

        registrar_auditoria(
            request,
            perfil,
            RegistroAuditoria.Acao.EDITADO,
            descricao=f"Perfil administrativo de {usuario.nome} ({usuario.email})",
            alteracoes=alteracoes or None,
        )

        return Response(
            AdminUsuarioSerializer(usuario).data,
            status=status.HTTP_200_OK,
        )


class PasswordResetRequestView(APIView):
    """Envia e-mail com link de redefinição de senha."""
    permission_classes = [AllowAny]
    throttle_classes = [PasswordResetRateThrottle]

    def post(self, request):
        email = request.data.get("email", "").strip().lower()
        # Resposta genérica para não revelar se o e-mail existe.
        resposta = Response(
            {"detail": "Se este e-mail estiver cadastrado, você receberá um link em breve."},
            status=status.HTTP_200_OK,
        )

        try:
            usuario = Usuario.objects.get(email=email)
        except Usuario.DoesNotExist:
            return resposta

        token_bruto = secrets.token_urlsafe(48)
        token_hash = hashlib.sha256(token_bruto.encode()).hexdigest()

        PasswordResetToken.objects.create(
            usuario=usuario,
            token_hash=token_hash,
            expira_em=timezone.now() + timedelta(hours=2),
            ip_solicitante=get_client_ip(request),
        )

        frontend_url = request.build_absolute_uri("/").rstrip("/")
        link = f"{frontend_url}/reset-senha?token={token_bruto}"

        send_mail(
            subject="Redefinição de senha — ACAPRA",
            message=(
                f"Olá, {usuario.nome}!\n\n"
                f"Clique no link abaixo para redefinir sua senha. "
                f"O link expira em 2 horas.\n\n{link}\n\n"
                "Se você não solicitou isso, ignore este e-mail."
            ),
            from_email=None,
            recipient_list=[usuario.email],
            fail_silently=True,
        )

        return resposta


class PasswordResetConfirmView(APIView):
    """Confirma nova senha usando o token recebido por e-mail."""
    permission_classes = [AllowAny]

    def post(self, request):
        token_bruto = request.data.get("token", "").strip()
        nova_senha = request.data.get("new_password", "").strip()

        if not token_bruto or not nova_senha:
            return Response(
                {"detail": "Token e nova senha são obrigatórios."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        token_hash = hashlib.sha256(token_bruto.encode()).hexdigest()

        try:
            reset_token = PasswordResetToken.objects.select_related("usuario").get(
                token_hash=token_hash
            )
        except PasswordResetToken.DoesNotExist:
            return Response(
                {"token": "Token inválido ou expirado."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not reset_token.valido:
            return Response(
                {"token": "Token inválido ou expirado."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        usuario = reset_token.usuario
        usuario.set_password(nova_senha)
        usuario.save(update_fields=["password"])

        reset_token.usado_em = timezone.now()
        reset_token.save(update_fields=["usado_em"])

        return Response(
            {"detail": "Senha redefinida com sucesso."},
            status=status.HTTP_200_OK,
        )