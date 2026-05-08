from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import (
    IsAuthenticated,
    AllowAny
)

from django.shortcuts import get_object_or_404

from .models import Animal
from .serializers import (AnimalSerializers,GetAnimalSerializer,UpdateAnimalSerializer)


class AnimaisView(APIView):
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
        return [IsAuthenticated()]

    def get(self, request):
        """
        Retorna lista pública de animais.
        """

        animais = Animal.objects.all().order_by('-id')

        serializer = GetAnimalSerializer(
            animais,
            many=True
        )

        return Response(serializer.data)

    def post(self, request):
        """
        Cria novo animal.
        """

        serializer = AnimalSerializer(data=request.data)

        serializer.is_valid(raise_exception=True)

        serializer.save()

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED
        )


class AnimalDetailView(APIView):
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

        return [IsAuthenticated()]

    def get_object(self, pk):
        """
        Busca animal pelo ID.
        """

        return get_object_or_404(Animal, pk=pk)

    def get(self, request, pk):
        """
        Retorna detalhes de um animal.
        """

        animal = self.get_object(pk)

        serializer = GetAnimalSerializer(animal)

        return Response(serializer.data)

    def put(self, request, pk):
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