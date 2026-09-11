from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from gerenciamento.permissions import require_module

from auditoria.models import RegistroAuditoria
from auditoria.services import registrar_auditoria

from .models import DocumentoInstitucional, Indicador
from .serializers import (
    DocumentoInstitucionalReadSerializer,
    DocumentoInstitucionalWriteSerializer,
    IndicadorReadSerializer,
    IndicadorWriteSerializer,
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
        registrar_auditoria(request, doc, RegistroAuditoria.Acao.CRIADO)
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
        registrar_auditoria(
            request,
            doc,
            RegistroAuditoria.Acao.EDITADO,
            alteracoes={"campos_editados": sorted(request.data.keys())},
        )
        return Response(DocumentoInstitucionalReadSerializer(doc).data)

    def delete(self, request, pk):
        doc = self.get_object(pk)
        registrar_auditoria(
            request,
            doc,
            RegistroAuditoria.Acao.EXCLUIDO,
            descricao=str(doc),
        )
        if doc.arquivo:
            doc.arquivo.delete(save=False)
        doc.delete()
        # 204 não pode ter corpo (quebra parsers/proxies HTTP). Resposta vazia.
        return Response(status=status.HTTP_204_NO_CONTENT)


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
