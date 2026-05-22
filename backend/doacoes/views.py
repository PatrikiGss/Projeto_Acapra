from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny

from .models import DadosPix
from .serializers import GetDadosPixSerializer


class DadosPixView(APIView):
    """
    Endpoint responsável por:

    GET:
        Lista os dados de Pix ativos para doação pública
    """
    
    permission_classes = [AllowAny]

    def get(self, request):
        """
        Retorna lista pública de dados Pix ativos.
        """
        dados_pix = DadosPix.objects.filter(ativo=True).order_by('-id')

        serializer = GetDadosPixSerializer(
            dados_pix,
            many=True,
            context={'request': request}
        )

        return Response(serializer.data)


class DadosPixDetailView(APIView):
    """
    Endpoint responsável por:

    GET:
        Retorna detalhes públicos de um dado Pix específico
    """
    
    permission_classes = [AllowAny]

    def get(self, request, pk):
        """
        Retorna detalhes de um dado Pix específico.
        """
        try:
            dados_pix = DadosPix.objects.get(pk=pk, ativo=True)
        except DadosPix.DoesNotExist:
            return Response(
                {"detail": "Dados de Pix não encontrados."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = GetDadosPixSerializer(dados_pix, context={'request': request})
        return Response(serializer.data)
