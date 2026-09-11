from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from gerenciamento.permissions import require_module
from core.throttling import PublicFormRateThrottle

from .models import LarVoluntario
from .serializers import (
    LarVoluntarioSerializer,
    GetLarVoluntarioSerializer,
    CreateLarVoluntarioSerializer,
)


class LaresView(APIView):
    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated(), require_module("voluntariado")()]
        return [AllowAny()]

    def get_throttles(self):
        # Limita o cadastro público de lares voluntários (20/min por IP).
        if self.request.method == 'POST':
            return [PublicFormRateThrottle()]
        return super().get_throttles()

    def get(self, request):
        lares = LarVoluntario.objects.all().order_by('-created_at')
        serializer = GetLarVoluntarioSerializer(lares, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        serializer = CreateLarVoluntarioSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        lar = serializer.save()
        return Response(
            {
                "detail": "Cadastro de lar voluntário enviado! Entraremos em contato em breve.",
                "id": lar.id,
                "nome_responsavel": lar.nome_responsavel,
            },
            status=status.HTTP_201_CREATED,
        )


class LarDetailView(APIView):
    def get_permissions(self):
        return [IsAuthenticated(), require_module("voluntariado")()]

    def get_object(self, pk):
        try:
            return LarVoluntario.objects.get(pk=pk)
        except LarVoluntario.DoesNotExist:
            return None

    def get(self, request, pk):
        lar = self.get_object(pk)
        if not lar:
            return Response({"detail": "Lar voluntário não encontrado."}, status=status.HTTP_404_NOT_FOUND)
        serializer = GetLarVoluntarioSerializer(lar, context={'request': request})
        return Response(serializer.data)

    def patch(self, request, pk):
        lar = self.get_object(pk)
        if not lar:
            return Response({"detail": "Lar voluntário não encontrado."}, status=status.HTTP_404_NOT_FOUND)
        serializer = LarVoluntarioSerializer(lar, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        lar = self.get_object(pk)
        if not lar:
            return Response({"detail": "Lar voluntário não encontrado."}, status=status.HTTP_404_NOT_FOUND)
        lar.delete()
        # 204 não pode ter corpo (quebra parsers/proxies HTTP). Resposta vazia.
        return Response(status=status.HTTP_204_NO_CONTENT)
