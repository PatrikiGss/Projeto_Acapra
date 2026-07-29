import logging

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import (
    IsAuthenticated,
    AllowAny
)
from rest_framework.throttling import ScopedRateThrottle
from gerenciamento.permissions import require_module

from django.shortcuts import get_object_or_404

from core.images import apagar_arquivos, coletar_arquivos_instancia
from .models import Animal
from .serializers import (AnimalSerializer,GetAnimalSerializer,UpdateAnimalSerializer)

logger = logging.getLogger(__name__)


class AnimaisView(APIView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "public_animals"

    """
    Endpoint responsável por:

    GET:
        Lista animais publicamente

    POST:
        Cria novo animal (requer autenticação)
    """

    def get_permissions(self):
        """
        Define permissões dinamicamente
        conforme o método HTTP.
        """

        # GET público
        if self.request.method == 'GET':
            return [AllowAny()]

        # POST autenticado
        return [IsAuthenticated(), require_module("adocao")()]

    def get(self, request):
        """
        Retorna lista pública de animais.
        Suporta filtro ?disponivel=true|false
        """

        animais = Animal.objects.prefetch_related('imagens').all().order_by('-id')

        disponivel_param = request.query_params.get('disponivel')
        if disponivel_param is not None:
            disponivel = disponivel_param.lower() != 'false'
            animais = animais.filter(disponivel=disponivel)

        serializer = GetAnimalSerializer(
            animais,
            many=True,
            context={'request':request}
        )

        return Response(serializer.data)

    def post(self, request):
        serializer = AnimalSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        animal = serializer.save()

        # Destinos escolhidos no formulário: feed e/ou story (ou nenhum).
        try:
            from meta_integration.services import auto_post_animal, flags_publicacao
            publicar, feed, story = flags_publicacao(request.data)
            if publicar:
                auto_post_animal(animal, feed=feed, story=story)
        except Exception as exc:
            logger.error("Erro ao publicar animal nas redes sociais: %s", exc)

        return Response(
            GetAnimalSerializer(animal, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


class AnimalDetailView(APIView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "public_animals"

    """
    Endpoint responsável por:

    GET:
        Retorna detalhes públicos do animal

    PUT:
        Atualiza animal (autenticado)

    DELETE:
        Remove animal (autenticado)
    """

    def get_permissions(self):
        """
        GET é público.
        PUT e DELETE exigem autenticação.
        """

        if self.request.method == 'GET':
            return [AllowAny()]

        return [IsAuthenticated(), require_module("adocao")()]

    def get_object(self, pk):
        """
        Busca animal pelo ID.
        """

        return get_object_or_404(Animal.objects.prefetch_related('imagens'), pk=pk)

    def get(self, request, pk):
        """
        Retorna detalhes de um animal.
        """

        animal = self.get_object(pk)

        serializer = GetAnimalSerializer(animal, context={'request': request})

        return Response(serializer.data)

    def patch(self, request, pk):
        """
        Atualiza dados do animal.
        """

        animal = self.get_object(pk)

        serializer = UpdateAnimalSerializer(
            animal,
            data=request.data,
            partial=True,
            context={'request': request},
        )

        serializer.is_valid(raise_exception=True)

        serializer.save()

        return Response(serializer.data)

    def delete(self, request, pk):
        """
        Remove animal do sistema.
        """

        animal = self.get_object(pk)

        # Coleta os arquivos ANTES de excluir (cascata apaga a relação imagens),
        # exclui o registro (operação autoritativa) e só então apaga os arquivos
        # em melhor-esforço — assim uma falha de storage não vira 500.
        arquivos = coletar_arquivos_instancia(animal)
        animal.delete()
        apagar_arquivos(arquivos)

        # 204 não pode ter corpo (quebra parsers/proxies HTTP). Resposta vazia.
        return Response(status=status.HTTP_204_NO_CONTENT)
