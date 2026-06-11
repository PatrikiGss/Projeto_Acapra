from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import PermissionDenied

from .models import ContatoAcapra
from .serializers import ContatoSerializer


def _is_master(user):
    perfil = getattr(user, 'perfil_admin', None)
    return perfil is not None and perfil.nivel == 'master'


class ContatoView(APIView):

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request):
        contato = ContatoAcapra.get_instance()
        return Response(ContatoSerializer(contato).data)

    def patch(self, request):
        if not _is_master(request.user):
            raise PermissionDenied("Apenas o Diretor ACAPRA pode editar as informações de contato.")

        contato = ContatoAcapra.get_instance()
        serializer = ContatoSerializer(contato, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
