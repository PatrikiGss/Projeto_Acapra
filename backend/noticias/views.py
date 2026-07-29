import logging

from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from gerenciamento.permissions import require_module
from rest_framework.response import Response
from rest_framework.views import APIView

from core.images import apagar_arquivos, coletar_arquivos_instancia
from .models import CategoriaNoticia, Publicacao
from .serializers import GetPublicacaoSerializer, PublicacaoWriteSerializer

logger = logging.getLogger(__name__)


class PublicacoesView(APIView):
    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]

        return [IsAuthenticated(), require_module("noticias")()]

    def get_queryset(self, request):
        queryset = Publicacao.objects.prefetch_related("imagens").order_by("-created_at")
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
        serializer = PublicacaoWriteSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        publicacao = serializer.save()

        # Publica nas redes nos destinos escolhidos (feed e/ou story). Opcional
        # via publicar_redes=false; falha aqui não impede a criação.
        try:
            from meta_integration.services import auto_post_publicacao, flags_publicacao
            publicar, feed, story = flags_publicacao(request.data)
            if publicar:
                auto_post_publicacao(publicacao, feed=feed, story=story)
        except Exception as exc:
            logger.error("Erro ao publicar notícia nas redes sociais: %s", exc)

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
        base = Publicacao.objects.prefetch_related("imagens")
        queryset = base if include_inactive else base.filter(ativo=True)
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
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        publicacao = serializer.save()
        return Response(
            GetPublicacaoSerializer(publicacao, context={"request": request}).data
        )

    def delete(self, request, pk):
        publicacao = self.get_object(pk, include_inactive=True)
        # Coleta os arquivos ANTES de excluir (cascata apaga a relação imagens),
        # exclui o registro (operação autoritativa) e só então apaga os arquivos
        # em melhor-esforço — assim uma falha de storage não vira 500.
        arquivos = coletar_arquivos_instancia(publicacao)
        publicacao.delete()
        apagar_arquivos(arquivos)
        # 204 não pode ter corpo (quebra parsers/proxies HTTP). Resposta vazia.
        return Response(status=status.HTTP_204_NO_CONTENT)
