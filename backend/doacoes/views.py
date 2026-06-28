from rest_framework import status
from rest_framework.exceptions import NotFound
from rest_framework.permissions import AllowAny, IsAuthenticated
from gerenciamento.permissions import require_module
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404

from auditoria.models import RegistroAuditoria
from auditoria.services import registrar_auditoria
from core.throttling import PublicFormRateThrottle

from .models import DadosPix, OfertaDoacao
from .serializers import (
    DadosPixWriteSerializer,
    GetDadosPixSerializer,
    OfertaDoacaoAdminSerializer,
    OfertaDoacaoCreateSerializer,
    OfertaDoacaoStatusSerializer,
)


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
        # 204 não pode ter corpo (quebra parsers/proxies HTTP). Resposta vazia.
        return Response(status=status.HTTP_204_NO_CONTENT)


class OfertasDoacaoView(APIView):
    """
    GET  /api/doacoes/ofertas/  — Lista as ofertas (requer módulo 'doacoes')
    POST /api/doacoes/ofertas/  — Registra uma oferta de doação (público)
    """

    def get_permissions(self):
        if self.request.method == "POST":
            return [AllowAny()]
        return [IsAuthenticated(), require_module("doacoes")()]

    def get_throttles(self):
        # Limita o envio público para evitar spam.
        if self.request.method == "POST":
            return [PublicFormRateThrottle()]
        return super().get_throttles()

    def get(self, request):
        ofertas = OfertaDoacao.objects.all()
        serializer = OfertaDoacaoAdminSerializer(ofertas, many=True, context={"request": request})
        return Response(serializer.data)

    def post(self, request):
        serializer = OfertaDoacaoCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {"detail": "Oferta registrada com sucesso. Em breve entraremos em contato. Obrigado!"},
            status=status.HTTP_201_CREATED,
        )


class OfertaDoacaoDetailView(APIView):
    """
    PATCH  /api/doacoes/ofertas/<pk>/  — Atualiza o status (admin)
    DELETE /api/doacoes/ofertas/<pk>/  — Remove a oferta (admin)
    """

    def get_permissions(self):
        return [IsAuthenticated(), require_module("doacoes")()]

    def get_object(self, pk):
        return get_object_or_404(OfertaDoacao, pk=pk)

    def patch(self, request, pk):
        oferta = self.get_object(pk)
        serializer = OfertaDoacaoStatusSerializer(oferta, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(OfertaDoacaoAdminSerializer(oferta, context={"request": request}).data)

    def delete(self, request, pk):
        oferta = self.get_object(pk)
        oferta.delete()
        # 204 não pode ter corpo (quebra parsers/proxies HTTP). Resposta vazia.
        return Response(status=status.HTTP_204_NO_CONTENT)
