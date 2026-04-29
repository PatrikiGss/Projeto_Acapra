from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import PerfilAdministrativo
from .serializers import PerfilAdministrativoSerializer


class PerfilAdministrativoViewSet(viewsets.ModelViewSet):
    """
    View responsável pelo CRUD completo
    de PerfilAdministrativo.

    ====================================================
     ModelViewSet
    ====================================================

    O Django REST Framework já fornece
    um CRUD completo automaticamente.

    Isso significa que esta única classe já cria:

    GET     -> listar registros
    GET/id  -> buscar registro específico
    POST    -> criar registro
    PUT     -> atualizar completo
    PATCH   -> atualizar parcial
    DELETE  -> deletar registro

    ====================================================
    queryset
    ====================================================

    Define quais dados essa view manipula.

    Aqui:

    todos os PerfisAdministrativos.

    ====================================================
    serializer_class
    ====================================================

    Define qual serializer será usado
    para entrada e saída de dados.

    Aqui usamos:

    PerfilAdministrativoSerializer

    ====================================================
    permission_classes
    ====================================================

    Controla quem pode acessar.

    IsAuthenticated significa:

    apenas usuários logados
    com token JWT válido.

    Sem token:

    acesso negado.
    """

    queryset = PerfilAdministrativo.objects.all()
    serializer_class = PerfilAdministrativoSerializer
    permission_classes = [IsAuthenticated]
