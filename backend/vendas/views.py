from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny

from django.shortcuts import get_object_or_404

from .models import Produto
from .serializers import (
    ProdutoSerializer,
    GetProdutoSerializer,
    UpdateProdutoSerializer
)


class ProdutosView(APIView):
    """
    Endpoint responsável por:

    GET:
        Lista produtos ativos publicamente

    POST:
        Cria novo produto (requer autenticação)
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
        Retorna lista pública de produtos ativos.
        """
        produtos = Produto.objects.filter(ativo=True).order_by('-id')

        serializer = GetProdutoSerializer(
            produtos,
            many=True,
            context={'request': request}
        )

        return Response(serializer.data)

    def post(self, request):
        """
        Cria novo produto (autenticado).
        """
        serializer = ProdutoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        produto = serializer.save()
        return Response(
            GetProdutoSerializer(produto, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


class ProdutoDetailView(APIView):
    """
    Endpoint responsável por:

    GET:
        Retorna detalhes públicos do produto

    PATCH:
        Atualiza produto (autenticado)

    DELETE:
        Remove produto (autenticado)
    """

    def get_permissions(self):
        """
        GET é público.
        PATCH e DELETE exigem autenticação.
        """
        if self.request.method == 'GET':
            return [AllowAny()]

        return [IsAuthenticated()]

    def get_object(self, pk):
        """
        Busca produto pelo ID.
        """
        return get_object_or_404(Produto, pk=pk)

    def get(self, request, pk):
        """
        Retorna detalhes de um produto.
        """
        produto = self.get_object(pk)

        serializer = GetProdutoSerializer(produto, context={'request': request})

        return Response(serializer.data)

    def patch(self, request, pk):
        """
        Atualiza dados do produto.
        """
        produto = self.get_object(pk)

        serializer = UpdateProdutoSerializer(
            produto,
            data=request.data,
            partial=True
        )

        serializer.is_valid(raise_exception=True)

        serializer.save()

        return Response(serializer.data)

    def delete(self, request, pk):
        """
        Remove produto do sistema.
        """
        produto = self.get_object(pk)

        produto.delete()

        return Response(
            {"detail": f"Produto {pk} removido com sucesso."},
            status=status.HTTP_204_NO_CONTENT
        )


class ProdutosPorTipoView(APIView):
    """
    Endpoint responsável por:

    GET:
        Lista produtos de um tipo específico (humano ou pet)
    """
    
    permission_classes = [AllowAny]

    def get(self, request, tipo):
        """
        Retorna lista de produtos filtrados por tipo.
        """
        tipos_validos = ['humano', 'pet']
        
        if tipo not in tipos_validos:
            return Response(
                {"detail": f"Tipo inválido. Use: {', '.join(tipos_validos)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        produtos = Produto.objects.filter(tipo=tipo, ativo=True).order_by('-id')

        serializer = GetProdutoSerializer(
            produtos,
            many=True,
            context={'request': request}
        )

        return Response(serializer.data)
