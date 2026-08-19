from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.throttling import PublicFormRateThrottle
from gerenciamento.permissions import require_module

from .models import PedidoCastracao
from .serializers import (
    CreatePedidoCastracaoSerializer,
    GetPedidoCastracaoSerializer,
    PedidoCastracaoStatusSerializer,
)


class CastracoesView(APIView):
    """
    GET  /api/castracao/castracoes/  — Lista os pedidos (requer módulo 'castracao')
    POST /api/castracao/castracoes/  — Cria pedido de castração (público)
    """

    def get_permissions(self):
        # POST público; leitura só para administradores do módulo.
        if self.request.method == 'POST':
            return [AllowAny()]
        return [IsAuthenticated(), require_module("castracao")()]

    def get_throttles(self):
        # Limita o envio público de pedidos (20/min por IP).
        if self.request.method == 'POST':
            return [PublicFormRateThrottle()]
        return super().get_throttles()

    def get(self, request):
        pedidos = PedidoCastracao.objects.all()
        serializer = GetPedidoCastracaoSerializer(
            pedidos,
            many=True,
            context={'request': request},
        )
        return Response(serializer.data)

    def post(self, request):
        serializer = CreatePedidoCastracaoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        pedido = serializer.save()
        return Response(
            {
                "detail": "Pedido de castração enviado! Entraremos em contato em breve.",
                "id": pedido.id,
            },
            status=status.HTTP_201_CREATED,
        )


class CastracaoDetailView(APIView):
    """
    GET    /api/castracao/castracoes/<pk>/  — Detalhe (admin)
    PATCH  /api/castracao/castracoes/<pk>/  — Atualiza o andamento (admin)
    DELETE /api/castracao/castracoes/<pk>/  — Remove o pedido (admin)
    """

    def get_permissions(self):
        return [IsAuthenticated(), require_module("castracao")()]

    def get_object(self, pk):
        return get_object_or_404(PedidoCastracao, pk=pk)

    def get(self, request, pk):
        pedido = self.get_object(pk)
        serializer = GetPedidoCastracaoSerializer(pedido, context={'request': request})
        return Response(serializer.data)

    def patch(self, request, pk):
        pedido = self.get_object(pk)
        serializer = PedidoCastracaoStatusSerializer(pedido, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            GetPedidoCastracaoSerializer(pedido, context={'request': request}).data
        )

    def delete(self, request, pk):
        pedido = self.get_object(pk)
        pedido.delete()
        # 204 não pode ter corpo (quebra parsers/proxies HTTP). Resposta vazia.
        return Response(status=status.HTTP_204_NO_CONTENT)
