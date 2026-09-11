from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import PermissionDenied

from gerenciamento.models import PerfilAdministrativo
from gerenciamento.permissions import get_nivel_usuario

from .models import ContatoAcapra
from .serializers import ContatoSerializer


def _is_diretor(user):
    return get_nivel_usuario(user) == PerfilAdministrativo.Nivel.DIRETOR_ACAPRA


class ContatoView(APIView):

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request):
        contato = ContatoAcapra.get_instance()
        return Response(ContatoSerializer(contato).data)

    def patch(self, request):
        if not _is_diretor(request.user):
            raise PermissionDenied("Apenas o Diretor ACAPRA pode editar as informações de contato.")

        contato = ContatoAcapra.get_instance()
        serializer = ContatoSerializer(contato, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
