from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from gerenciamento.permissions import require_module
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import CategoriaNoticia, Publicacao
from .serializers import GetPublicacaoSerializer, PublicacaoWriteSerializer


class PublicacoesView(APIView):
    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]

        return [IsAuthenticated(), require_module("noticias")()]

    def get_queryset(self, request):
        queryset = Publicacao.objects.all().order_by("-created_at")
        categoria = request.query_params.get("categoria")

        if categoria:
            categorias_validas = {valor for valor, _ in CategoriaNoticia.choices}
            if categoria not in categorias_validas:
                return Publicacao.objects.none()
            queryset = queryset.filter(categoria=categoria)

        if not request.user.is_authenticated:
            queryset = queryset.filter(ativo=True)

        return queryset

    def get(self, request):
        queryset = self.get_queryset(request)
        serializer = GetPublicacaoSerializer(
            queryset,
            many=True,
            context={"request": request},
        )
        return Response(serializer.data)

    def post(self, request):
        serializer = PublicacaoWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        publicacao = serializer.save()
        return Response(
            GetPublicacaoSerializer(publicacao, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class PublicacaoDetailView(APIView):
    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]

        return [IsAuthenticated(), require_module("noticias")()]

    def get_object(self, pk, include_inactive=False):
        queryset = Publicacao.objects.all() if include_inactive else Publicacao.objects.filter(ativo=True)
        return get_object_or_404(queryset, pk=pk)

    def get(self, request, pk):
        publicacao = self.get_object(pk, include_inactive=request.user.is_authenticated)
        serializer = GetPublicacaoSerializer(publicacao, context={"request": request})
        return Response(serializer.data)

    def patch(self, request, pk):
        publicacao = self.get_object(pk, include_inactive=True)
        serializer = PublicacaoWriteSerializer(
            publicacao,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        publicacao = serializer.save()
        return Response(
            GetPublicacaoSerializer(publicacao, context={"request": request}).data
        )

    def delete(self, request, pk):
        publicacao = self.get_object(pk, include_inactive=True)
        if publicacao.foto:
            publicacao.foto.delete(save=False)
        publicacao.delete()
        return Response(
            {"detail": f"Publicação {pk} removida com sucesso."},
            status=status.HTTP_204_NO_CONTENT,
        )
