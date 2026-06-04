from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

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

        return [IsAuthenticated()]

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

        return [IsAuthenticated()]

    def get_object(self, pk, include_inactive=False):
        queryset = DadosPix.objects.all() if include_inactive else DadosPix.objects.filter(ativo=True)
        return get_object_or_404(queryset, pk=pk)

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
        return Response(
            GetDadosPixSerializer(dados_pix, context={"request": request}).data
        )

    def delete(self, request, pk):
        dados_pix = self.get_object(pk, include_inactive=True)
        if dados_pix.qr_code:
            dados_pix.qr_code.delete(save=False)
        dados_pix.delete()
        return Response(
            {"detail": f"Dado Pix {pk} removido com sucesso."},
            status=status.HTTP_204_NO_CONTENT,
        )
