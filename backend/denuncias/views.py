from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from rest_framework.permissions import (
    AllowAny,
    IsAuthenticated
)

from django.shortcuts import get_object_or_404

from .models import Denuncia

from .serializers import (
    DenunciaSerializer,
    GetDenunciaSerializer,
    UpdateDenunciaSerializer
)


class DenunciasView(APIView):

    def get_permissions(self):

        if self.request.method == "GET":
            return [AllowAny()]

        return [IsAuthenticated()]

    def get(self, request):

        denuncias = Denuncia.objects.all().order_by("-id")

        serializer = GetDenunciaSerializer(
            denuncias,
            many=True
        )

        return Response(serializer.data)

    def post(self, request):

        serializer = DenunciaSerializer(
            data=request.data
        )

        serializer.is_valid(raise_exception=True)

        serializer.save()

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED
        )


class DenunciaDetailView(APIView):

    def get_permissions(self):

        if self.request.method == "GET":
            return [AllowAny()]

        return [IsAuthenticated()]

    def get_object(self, pk):

        return get_object_or_404(
            Denuncia,
            pk=pk
        )

    def get(self, request, pk):

        denuncia = self.get_object(pk)

        serializer = GetDenunciaSerializer(
            denuncia
        )

        return Response(serializer.data)

    def put(self, request, pk):

        denuncia = self.get_object(pk)

        serializer = UpdateDenunciaSerializer(
            denuncia,
            data=request.data,
            partial=True
        )

        serializer.is_valid(raise_exception=True)

        serializer.save()

        return Response(serializer.data)

    def delete(self, request, pk):

        denuncia = self.get_object(pk)

        denuncia.delete()

        return Response(
            {
                "detail": f"Denúncia {pk} removida com sucesso."
            },
            status=status.HTTP_204_NO_CONTENT
        )