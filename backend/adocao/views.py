from rest_framework import viewsets, permissions
from .models import Animal
from .serializers import AnimalSerializer

class AnimalViewSet(viewsets.ModelViewSet):
    queryset = Animal.objects.all()
    serializer_class = AnimalSerializer
    
    def get_permissions(self):
        if self.request.method in ['GET']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]