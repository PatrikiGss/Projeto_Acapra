from rest_framework import viewsets
from .models import Contato
from .serializers import ContatoSerializer


class ContatoViewSet(viewsets.ModelViewSet):
    queryset = Contato.objects.all()
    serializer_class = ContatoSerializer