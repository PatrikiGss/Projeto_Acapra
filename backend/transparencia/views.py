from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from gerenciamento.permissions import require_module

from .models import CategoriaDocumento, DocumentoTransparencia
from .serializers import DocumentoTransparenciaSerializer


class DocumentosTransparenciaView(APIView):
    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]

        return [IsAuthenticated(), require_module("transparencia")()]

    def get_queryset(self, request):
        queryset = DocumentoTransparencia.objects.all()

        if not request.user.is_authenticated:
            queryset = queryset.filter(ativo=True)

        categoria = request.query_params.get("categoria")
        if categoria:
            categorias_validas = {valor for valor, _ in CategoriaDocumento.choices}
            if categoria not in categorias_validas:
                return DocumentoTransparencia.objects.none()
            queryset = queryset.filter(categoria=categoria)

        ano = request.query_params.get("ano")
        if ano:
            try:
                queryset = queryset.filter(ano=int(ano))
            except (TypeError, ValueError):
                return DocumentoTransparencia.objects.none()

        return queryset.order_by("-ano", "-created_at", "-id")

    def get(self, request):
        queryset = self.get_queryset(request)
        serializer = DocumentoTransparenciaSerializer(
            queryset,
            many=True,
            context={"request": request},
        )
        return Response(serializer.data)

    def post(self, request):
        serializer = DocumentoTransparenciaSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        documento = serializer.save()
        return Response(
            DocumentoTransparenciaSerializer(documento, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class DocumentoTransparenciaDetailView(APIView):
    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]

        return [IsAuthenticated(), require_module("transparencia")()]

    def get_object(self, pk, include_inactive=False):
        queryset = DocumentoTransparencia.objects.all() if include_inactive else DocumentoTransparencia.objects.filter(ativo=True)
        return get_object_or_404(queryset, pk=pk)

    def get(self, request, pk):
        documento = self.get_object(pk, include_inactive=request.user.is_authenticated)
        serializer = DocumentoTransparenciaSerializer(documento, context={"request": request})
        return Response(serializer.data)

    def patch(self, request, pk):
        documento = self.get_object(pk, include_inactive=True)
        serializer = DocumentoTransparenciaSerializer(
            documento,
            data=request.data,
            partial=True,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        documento = serializer.save()
        return Response(
            DocumentoTransparenciaSerializer(documento, context={"request": request}).data
        )

    def delete(self, request, pk):
        documento = self.get_object(pk, include_inactive=True)
        if documento.arquivo_pdf:
            documento.arquivo_pdf.delete(save=False)
        documento.delete()
        return Response(
            {"detail": f"Documento {pk} removido com sucesso."},
            status=status.HTTP_204_NO_CONTENT,
        )
