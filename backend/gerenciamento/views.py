from rest_framework.views import APIView
from rest_framework import status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.permissions import AllowAny
from django.contrib.auth import update_session_auth_hash
from .serializers import (UsuarioSerializer,UpdateUsuarioSerializer,GetUsuarioSerializer,ChangePasswordSerializer)


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

    def put(self, request):
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

        # Mantém o usuário logado após troca de senha
        update_session_auth_hash(request, user)

        user.save()

        return Response(
            {"detail": "Senha alterada com sucesso."},
            status=status.HTTP_200_OK
        )