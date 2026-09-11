from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated

from gerenciamento.permissions import IsDiretor

from .models import RegistroAuditoria
from .serializers import RegistroAuditoriaSerializer


class RegistrosAuditoriaView(ListAPIView):
    """
    Listagem (somente leitura) da trilha de auditoria.

    Acesso restrito ao Diretor Acapra. Suporta filtro opcional por
    `?modelo=DadosPix` e `?acao=editado`.
    """

    permission_classes = [IsAuthenticated, IsDiretor]
    serializer_class = RegistroAuditoriaSerializer

    def get_queryset(self):
        queryset = RegistroAuditoria.objects.select_related("usuario").all()

        modelo = self.request.query_params.get("modelo")
        if modelo:
            queryset = queryset.filter(modelo=modelo)

        acao = self.request.query_params.get("acao")
        if acao:
            queryset = queryset.filter(acao=acao)

        return queryset
