from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.permissions import AllowAny
from .models import PerfilAdministrativo, Usuario
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
    UpdateUsuarioSerializer,
    UsuarioSerializer,
)
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken


class RegisterView(APIView):
    permission_classes = [AllowAny]
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