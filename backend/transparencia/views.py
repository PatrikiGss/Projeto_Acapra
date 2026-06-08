from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from gerenciamento.permissions import require_module

from .models import Categoria, DocumentoInstitucional, Indicador, Movimento
from .serializers import (
    CategoriaReadSerializer,
    CategoriaWriteSerializer,
    DocumentoInstitucionalReadSerializer,
    DocumentoInstitucionalWriteSerializer,
    IndicadorReadSerializer,
    IndicadorWriteSerializer,
    MovimentoReadSerializer,
    MovimentoWriteSerializer,
)


class CategoriasView(APIView):
    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated(), require_module("transparencia")()]

    def get(self, request):
        qs = Categoria.objects.prefetch_related("movimentos")
        if not request.user.is_authenticated:
            qs = qs.filter(ativo=True)
        tipo = request.query_params.get("tipo")
        if tipo in ("entrada", "saida"):
            qs = qs.filter(tipo=tipo)
        serializer = CategoriaReadSerializer(qs, many=True, context={"request": request})
        return Response(serializer.data)

    def post(self, request):
        serializer = CategoriaWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        categoria = serializer.save()
        return Response(
            CategoriaReadSerializer(categoria, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class CategoriaDetailView(APIView):
    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated(), require_module("transparencia")()]

    def get_object(self, pk):
        return get_object_or_404(Categoria, pk=pk)

    def get(self, request, pk):
        categoria = self.get_object(pk)
        return Response(CategoriaReadSerializer(categoria, context={"request": request}).data)

    def patch(self, request, pk):
        categoria = self.get_object(pk)
        serializer = CategoriaWriteSerializer(categoria, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        categoria = serializer.save()
        return Response(CategoriaReadSerializer(categoria, context={"request": request}).data)

    def delete(self, request, pk):
        categoria = self.get_object(pk)
        categoria.delete()
        return Response(
            {"detail": f"Categoria {pk} removida."},
            status=status.HTTP_204_NO_CONTENT,
        )


class MovimentosView(APIView):
    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated(), require_module("transparencia")()]

    def get(self, request):
        qs = Movimento.objects.select_related("categoria")
        if not request.user.is_authenticated:
            qs = qs.filter(ativo=True)
        categoria_id = request.query_params.get("categoria")
        if categoria_id:
            qs = qs.filter(categoria_id=categoria_id)
        tipo = request.query_params.get("tipo")
        if tipo in ("entrada", "saida"):
            qs = qs.filter(categoria__tipo=tipo)
        return Response(MovimentoReadSerializer(qs, many=True, context={"request": request}).data)

    def post(self, request):
        serializer = MovimentoWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        movimento = serializer.save()
        return Response(
            MovimentoReadSerializer(movimento, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class MovimentoDetailView(APIView):
    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated(), require_module("transparencia")()]

    def get_object(self, pk):
        return get_object_or_404(Movimento, pk=pk)

    def patch(self, request, pk):
        movimento = self.get_object(pk)

        remover = request.data.get("remover_comprovante") == "true"
        novo_comprovante = request.FILES.get("comprovante")

        if (remover or novo_comprovante) and movimento.comprovante:
            movimento.comprovante.delete(save=False)
            if not novo_comprovante:
                movimento.comprovante = None
                movimento.save(update_fields=["comprovante"])

        serializer = MovimentoWriteSerializer(movimento, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        movimento = serializer.save()
        return Response(MovimentoReadSerializer(movimento, context={"request": request}).data)

    def delete(self, request, pk):
        movimento = self.get_object(pk)
        if movimento.comprovante:
            movimento.comprovante.delete(save=False)
        movimento.delete()
        return Response(
            {"detail": f"Movimento {pk} removido."},
            status=status.HTTP_204_NO_CONTENT,
        )


class DocumentosInstitucionaisView(APIView):
    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated(), require_module("transparencia")()]

    def get(self, request):
        qs = DocumentoInstitucional.objects.all()
        if not request.user.is_authenticated:
            qs = qs.filter(ativo=True)
        return Response(DocumentoInstitucionalReadSerializer(qs, many=True).data)

    def post(self, request):
        serializer = DocumentoInstitucionalWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        doc = serializer.save()
        return Response(
            DocumentoInstitucionalReadSerializer(doc).data,
            status=status.HTTP_201_CREATED,
        )


class DocumentoInstitucionalDetailView(APIView):
    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated(), require_module("transparencia")()]

    def get_object(self, pk):
        return get_object_or_404(DocumentoInstitucional, pk=pk)

    def patch(self, request, pk):
        doc = self.get_object(pk)
        remover = request.data.get("remover_arquivo") == "true"
        novo_arquivo = request.FILES.get("arquivo")

        if (remover or novo_arquivo) and doc.arquivo:
            doc.arquivo.delete(save=False)
            if not novo_arquivo:
                doc.arquivo = None
                doc.save(update_fields=["arquivo"])

        serializer = DocumentoInstitucionalWriteSerializer(doc, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        doc = serializer.save()
        return Response(DocumentoInstitucionalReadSerializer(doc).data)

    def delete(self, request, pk):
        doc = self.get_object(pk)
        if doc.arquivo:
            doc.arquivo.delete(save=False)
        doc.delete()
        return Response(
            {"detail": f"Documento {pk} removido."},
            status=status.HTTP_204_NO_CONTENT,
        )


class IndicadoresView(APIView):
    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated(), require_module("transparencia")()]

    def get(self, request):
        # Garante que os três indicadores existam para leitura/edição.
        for chave in Indicador.Chave.values:
            Indicador.objects.get_or_create(chave=chave)
        qs = Indicador.objects.all()
        return Response(IndicadorReadSerializer(qs, many=True).data)


class IndicadorDetailView(APIView):
    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated(), require_module("transparencia")()]

    def get_object(self, pk):
        return get_object_or_404(Indicador, pk=pk)

    def patch(self, request, pk):
        indicador = self.get_object(pk)
        serializer = IndicadorWriteSerializer(indicador, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        indicador = serializer.save()
        return Response(IndicadorReadSerializer(indicador).data)
