from rest_framework import status
from rest_framework.exceptions import NotFound
from rest_framework.permissions import AllowAny, IsAuthenticated
from gerenciamento.permissions import require_module
from rest_framework.response import Response
from rest_framework.views import APIView

from auditoria.models import RegistroAuditoria
from auditoria.services import registrar_auditoria

from .models import DadosPix
from .serializers import DadosPixWriteSerializer, GetDadosPixSerializer


class DadosPixView(APIView):
    """
    Endpoint responsável por:

    GET:
        Lista os dados de Pix ativos para doação pública

    POST:
        Cria novo dado de Pix (requer autenticação)
    """

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]

        return [IsAuthenticated(), require_module("doacoes")()]

    def get(self, request):
        """
        Retorna lista de dados Pix.
        Públicamente mostra apenas ativos.
        Autenticado mostra tudo para permitir edição.
        """
        queryset = DadosPix.objects.all().order_by("-id")
        if not request.user.is_authenticated:
            queryset = queryset.filter(ativo=True)

        serializer = GetDadosPixSerializer(
            queryset,
            many=True,
            context={"request": request},
        )
        return Response(serializer.data)

    def post(self, request):
        serializer = DadosPixWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        dados_pix = serializer.save()
        registrar_auditoria(request, dados_pix, RegistroAuditoria.Acao.CRIADO)
        return Response(
            GetDadosPixSerializer(dados_pix, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class DadosPixDetailView(APIView):
    """
    Endpoint responsável por:

    GET:
        Retorna detalhes públicos de um dado Pix específico

    PATCH:
        Atualiza dado de Pix (autenticado)

    DELETE:
        Remove dado de Pix (autenticado)
    """

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]

        return [IsAuthenticated(), require_module("doacoes")()]

    def get_object(self, pk, include_inactive=False):
        queryset = DadosPix.objects.all() if include_inactive else DadosPix.objects.filter(ativo=True)
        try:
            return queryset.get(pk=pk)
        except DadosPix.DoesNotExist:
            raise NotFound("Dados Pix não encontrados.")

    def get(self, request, pk):
        dados_pix = self.get_object(pk, include_inactive=request.user.is_authenticated)
        serializer = GetDadosPixSerializer(dados_pix, context={"request": request})
        return Response(serializer.data)

    def patch(self, request, pk):
        dados_pix = self.get_object(pk, include_inactive=True)
        serializer = DadosPixWriteSerializer(
            dados_pix,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        dados_pix = serializer.save()
        registrar_auditoria(
            request,
            dados_pix,
            RegistroAuditoria.Acao.EDITADO,
            alteracoes={"campos_editados": sorted(request.data.keys())},
        )
        return Response(
            GetDadosPixSerializer(dados_pix, context={"request": request}).data
        )

    def delete(self, request, pk):
        dados_pix = self.get_object(pk, include_inactive=True)
        # Registra antes da exclusão para preservar o id/descrição no log.
        registrar_auditoria(
            request,
            dados_pix,
            RegistroAuditoria.Acao.EXCLUIDO,
            descricao=f"Pix #{dados_pix.pk}: {dados_pix.chave_pix}",
        )
        if dados_pix.qr_code:
            dados_pix.qr_code.delete(save=False)
        dados_pix.delete()
        return Response(
            {"detail": f"Dado Pix {pk} removido com sucesso."},
            status=status.HTTP_204_NO_CONTENT,
        )
