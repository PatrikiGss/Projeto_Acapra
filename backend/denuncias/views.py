from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.shortcuts import get_object_or_404

from gerenciamento.permissions import require_module
from core.throttling import PublicFormRateThrottle

from .models import Denuncia
from .serializers import (
    DenunciaCreateSerializer,
    DenunciaAdminSerializer,
    DenunciaStatusSerializer,
)


class DenunciasView(APIView):
    """
    GET  /api/denuncias/denuncias/  — Lista todas (requer módulo 'denuncias')
    POST /api/denuncias/denuncias/  — Cria denúncia (público)
    """

    def get_permissions(self):
        if self.request.method == "POST":
            return [AllowAny()]
        return [IsAuthenticated(), require_module("denuncias")()]

    def get_throttles(self):
        # Limita o envio público de denúncias (20/min por IP).
        if self.request.method == "POST":
            return [PublicFormRateThrottle()]
        return super().get_throttles()

    def get(self, request):
        denuncias = Denuncia.objects.all()
        serializer = DenunciaAdminSerializer(
            denuncias, many=True, context={"request": request}
        )
        return Response(serializer.data)

    def post(self, request):
        serializer = DenunciaCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {"detail": "Denúncia enviada com sucesso. Obrigado pelo contato."},
            status=status.HTTP_201_CREATED,
        )


class DenunciaDetailView(APIView):
    """
    GET    /api/denuncias/denuncias/<pk>/  — Detalhe (admin)
    PATCH  /api/denuncias/denuncias/<pk>/  — Atualiza status (admin)
    DELETE /api/denuncias/denuncias/<pk>/  — Remove (admin)
    """

    def get_permissions(self):
        return [IsAuthenticated(), require_module("denuncias")()]

    def get_object(self, pk):
        return get_object_or_404(Denuncia, pk=pk)

    def get(self, request, pk):
        denuncia = self.get_object(pk)
        serializer = DenunciaAdminSerializer(denuncia, context={"request": request})
        return Response(serializer.data)

    def patch(self, request, pk):
        denuncia = self.get_object(pk)
        serializer = DenunciaStatusSerializer(denuncia, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(DenunciaAdminSerializer(denuncia, context={"request": request}).data)

    def delete(self, request, pk):
        denuncia = self.get_object(pk)
        denuncia.delete()
        # 204 não pode ter corpo (quebra parsers/proxies HTTP). Resposta vazia.
        return Response(status=status.HTTP_204_NO_CONTENT)
