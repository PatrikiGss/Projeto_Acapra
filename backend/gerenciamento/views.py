import hashlib
import logging
import secrets
from datetime import timedelta

from django.conf import settings as django_settings
from django.contrib.auth.password_validation import validate_password as django_validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.mail import send_mail
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from core.throttling import (
    LoginRateThrottle,
    PasswordChangeRateThrottle,
    PasswordResetRateThrottle,
    RefreshRateThrottle,
    RegisterRateThrottle,
)
from .audit import get_client_ip, log_security_event
from .models import PasswordResetToken, PerfilAdministrativo, Usuario
from .permissions import (
    IsMaster,
    TemAcessoDashboard,
    get_modulos_usuario,
    get_nivel_usuario,
)
from .serializers import (
    AdminUsuarioSerializer,
    AtualizarPerfilAdministrativoSerializer,
    ChangePasswordSerializer,
    GetUsuarioSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    UpdateUsuarioSerializer,
    UsuarioSerializer,
)

logger = logging.getLogger(__name__)


class ThrottledLoginView(TokenObtainPairView):
    """Login JWT com rate limiting por IP (5/min)."""
    throttle_classes = [LoginRateThrottle]


class ThrottledRefreshView(TokenRefreshView):
    """Refresh de token com rate limiting por IP (10/min)."""
    throttle_classes = [RefreshRateThrottle]


class RegisterView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [RegisterRateThrottle]
    """
    Endpoint público para registro de novos usuários.

    Fluxo:
    - Recebe dados (nome, email, telefone, senha)
    - Valida via serializer
    - Cria usuário usando create_user (hash automático da senha)
    - Retorna dados do usuário (sem senha)
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
    permission_classes = [IsAuthenticated]
    throttle_classes = [PasswordChangeRateThrottle]

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)

        user = request.user

        user.set_password(serializer.validated_data['new_password'])
        user.save()

        # Invalida todos os tokens existentes (outras sessões)
        for token in OutstandingToken.objects.filter(user=user):
            BlacklistedToken.objects.get_or_create(token=token)

        # Emite novo par de tokens para manter a sessão atual ativa
        refresh = RefreshToken.for_user(user)

        log_security_event("password_changed", user, request)
        _notify_password_changed(user, request)

        return Response(
            {
                "detail": "Senha alterada com sucesso.",
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=status.HTTP_200_OK,
        )


def _log_email_config() -> None:
    logger.info(
        "[EMAIL] backend=%s host=%s port=%s tls=%s user=%s",
        django_settings.EMAIL_BACKEND,
        getattr(django_settings, "EMAIL_HOST", "-"),
        getattr(django_settings, "EMAIL_PORT", "-"),
        getattr(django_settings, "EMAIL_USE_TLS", "-"),
        getattr(django_settings, "EMAIL_HOST_USER", "-"),
    )


def _notify_password_changed(user, request) -> None:
    ip = get_client_ip(request)
    agora = timezone.now().strftime("%d/%m/%Y às %H:%M")
    logger.info("[EMAIL] Tentando enviar notificação de troca de senha para user_id=%s <%s>", user.pk, user.email)
    _log_email_config()
    try:
        send_mail(
            subject="Sua senha foi alterada — Acapra",
            message=(
                f"Olá, {user.nome}.\n\n"
                f"Sua senha foi alterada em {agora} a partir do IP {ip}.\n\n"
                "Se não foi você, entre em contato com o suporte imediatamente.\n\n"
                "— Equipe Acapra"
            ),
            from_email=django_settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
        logger.info("[EMAIL] Notificação de troca de senha enviada para user_id=%s", user.pk)
    except Exception:
        logger.exception("[EMAIL] Falha ao enviar e-mail de troca de senha para user_id=%s", user.pk)


def _send_password_reset_email(user, reset_url: str) -> None:
    logger.info("[EMAIL] Tentando enviar link de reset para user_id=%s <%s>", user.pk, user.email)
    _log_email_config()
    try:
        send_mail(
            subject="Redefinição de senha — Acapra",
            message=(
                f"Olá, {user.nome}.\n\n"
                "Você solicitou a redefinição de sua senha.\n"
                f"Clique no link abaixo (válido por 1 hora):\n\n"
                f"{reset_url}\n\n"
                "Se você não solicitou esta redefinição, ignore este e-mail.\n\n"
                "— Equipe Acapra"
            ),
            from_email=django_settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
        logger.info("[EMAIL] Link de reset enviado para user_id=%s", user.pk)
    except Exception:
        logger.exception("[EMAIL] Falha ao enviar e-mail de reset para user_id=%s", user.pk)


_RESET_RESPONSE = {
    "detail": (
        "Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha."
    )
}


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [PasswordResetRateThrottle]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]

        try:
            user = Usuario.objects.get(email=email)
        except Usuario.DoesNotExist:
            # Resposta idêntica para não revelar se o e-mail existe (anti-enumeração)
            return Response(_RESET_RESPONSE, status=status.HTTP_200_OK)

        # Invalida tokens de reset anteriores ainda não usados
        PasswordResetToken.objects.filter(usuario=user, usado_em__isnull=True).delete()

        token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(token.encode()).hexdigest()

        PasswordResetToken.objects.create(
            usuario=user,
            token_hash=token_hash,
            expira_em=timezone.now() + timedelta(hours=1),
            ip_solicitante=get_client_ip(request),
        )

        reset_url = f"{django_settings.FRONTEND_URL}/reset-senha?token={token}"
        _send_password_reset_email(user, reset_url)
        log_security_event("password_reset_requested", user, request)

        return Response(_RESET_RESPONSE, status=status.HTTP_200_OK)


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [PasswordResetRateThrottle]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        raw_token = serializer.validated_data["token"]
        new_password = serializer.validated_data["new_password"]
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()

        try:
            reset_token = PasswordResetToken.objects.select_related("usuario").get(
                token_hash=token_hash,
                usado_em__isnull=True,
            )
        except PasswordResetToken.DoesNotExist:
            return Response(
                {"token": ["Token inválido ou já utilizado."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if reset_token.expirado:
            return Response(
                {"token": ["Token expirado. Solicite um novo link."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = reset_token.usuario

        # Valida a nova senha com contexto do usuário (ex.: UserAttributeSimilarityValidator)
        try:
            django_validate_password(new_password, user)
        except DjangoValidationError as exc:
            return Response(
                {"new_password": list(exc.messages)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new_password)
        user.save()

        reset_token.usado_em = timezone.now()
        reset_token.save(update_fields=["usado_em"])

        # Invalida todas as sessões ativas do usuário
        for token_obj in OutstandingToken.objects.filter(user=user):
            BlacklistedToken.objects.get_or_create(token=token_obj)

        log_security_event("password_reset_confirmed", user, request)
        _notify_password_changed(user, request)

        return Response(
            {"detail": "Senha redefinida com sucesso."},
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
        estatisticas = {}

        if nivel == PerfilAdministrativo.Nivel.MASTER:
            estatisticas = {
                "animais": Animal.objects.count(),
                "publicacoes": Publicacao.objects.count(),
                "produtos": Produto.objects.count(),
                "dados_pix": DadosPix.objects.count(),
                "usuarios": Usuario.objects.count(),
                "voluntarios": Voluntario.objects.count(),
            }
        elif nivel == PerfilAdministrativo.Nivel.FINANCEIRO:
            estatisticas = {
                "dados_pix": DadosPix.objects.count(),
            }
        elif nivel == PerfilAdministrativo.Nivel.DOACOES:
            estatisticas = {
                "animais": Animal.objects.count(),
                "publicacoes": Publicacao.objects.count(),
            }

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
    permission_classes = [IsAuthenticated, IsMaster]

    def get(self, request):
        usuarios = Usuario.objects.select_related("perfil_admin").order_by("nome")
        serializer = AdminUsuarioSerializer(usuarios, many=True)
        return Response(serializer.data)


class AdminPerfilUpdateView(APIView):
    permission_classes = [IsAuthenticated, IsMaster]

    def patch(self, request, pk):
        usuario = get_object_or_404(
            Usuario.objects.select_related("perfil_admin"),
            pk=pk,
        )
        perfil = usuario.perfil_admin

        serializer = AtualizarPerfilAdministrativoSerializer(
            perfil,
            data=request.data,
            partial=True,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save(promovido_por=request.user)

        return Response(
            AdminUsuarioSerializer(usuario).data,
            status=status.HTTP_200_OK,
        )