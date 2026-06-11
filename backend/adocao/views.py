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
        """

        animais = Animal.objects.prefetch_related('imagens').all().order_by('-id')

        serializer = GetAnimalSerializer(
            animais,
            many=True,
            context={'request':request}
        )

        return Response(serializer.data)

    def post(self, request):
        serializer = AnimalSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        animal = serializer.save()

        publicar = request.data.get('publicar_redes', 'true') == 'true'
        if publicar:
            try:
                from meta_integration.services import auto_post_animal
                auto_post_animal(animal)
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
            partial=True
        )

        serializer.is_valid(raise_exception=True)

        serializer.save()

        return Response(serializer.data)

    def delete(self, request, pk):
        """
        Remove animal do sistema.
        """

        animal = self.get_object(pk)

        animal.delete()

        return Response(
            {"detail": f"Animal {pk} removido com sucesso."},
            status=status.HTTP_204_NO_CONTENT
        )
