from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny

from .models import Voluntario
from .serializers import (
    VoluntarioSerializer,
    GetVoluntarioSerializer,
    CreateVoluntarioSerializer
)


class VoluntariosView(APIView):
    """
    Endpoint responsável por:

    GET:
        Lista voluntários (requer autenticação)

    POST:
        Cria novo voluntário (público)
    """

    def get_permissions(self):
        """
        Define permissões dinamicamente
        conforme o método HTTP.
        """
        # GET autenticado (apenas admin)
        if self.request.method == 'GET':
            return [IsAuthenticated()]

        # POST público
        return [AllowAny()]

    def get(self, request):
        """
        Retorna lista de voluntários (autenticado).
        """
        voluntarios = Voluntario.objects.all().order_by('-created_at')

        serializer = GetVoluntarioSerializer(
            voluntarios,
            many=True,
            context={'request': request}
        )

        return Response(serializer.data)

    def post(self, request):
        """
        Cria novo voluntário (público).
        """
        serializer = CreateVoluntarioSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        voluntario = serializer.save()
        return Response(
            {
                "detail": "Obrigado por se voluntariar! Entraremos em contato em breve.",
                "id": voluntario.id,
                "nome": voluntario.nome
            },
            status=status.HTTP_201_CREATED,
        )


class VoluntarioDetailView(APIView):
    """
    Endpoint responsável por:

    GET:
        Retorna detalhes de um voluntário (autenticado)

    PATCH:
        Atualiza voluntário (autenticado)

    DELETE:
        Remove voluntário (autenticado)
    """

    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        """
        Busca voluntário pelo ID.
        """
        try:
            return Voluntario.objects.get(pk=pk)
        except Voluntario.DoesNotExist:
            return None

    def get(self, request, pk):
        """
        Retorna detalhes de um voluntário.
        """
        voluntario = self.get_object(pk)
        
        if not voluntario:
            return Response(
                {"detail": "Voluntário não encontrado."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = GetVoluntarioSerializer(voluntario, context={'request': request})
        return Response(serializer.data)

    def patch(self, request, pk):
        """
        Atualiza dados do voluntário.
        """
        voluntario = self.get_object(pk)
        
        if not voluntario:
            return Response(
                {"detail": "Voluntário não encontrado."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = VoluntarioSerializer(
            voluntario,
            data=request.data,
            partial=True
        )

        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data)

    def delete(self, request, pk):
        """
        Remove voluntário do sistema.
        """
        voluntario = self.get_object(pk)
        
        if not voluntario:
            return Response(
                {"detail": "Voluntário não encontrado."},
                status=status.HTTP_404_NOT_FOUND
            )

        voluntario.delete()

        return Response(
            {"detail": f"Voluntário {pk} removido com sucesso."},
            status=status.HTTP_204_NO_CONTENT
        )
