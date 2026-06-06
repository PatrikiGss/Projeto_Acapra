from django.urls import path
from .views import VoluntariosView, VoluntarioDetailView

app_name = 'voluntariado'

urlpatterns = [
    # Lista todos os voluntários (autenticado)
    # Cria novo voluntário (público)
    path('voluntarios/', VoluntariosView.as_view(), name='voluntarios'),
    # Busca voluntário específico (autenticado)
    # Atualiza voluntário (autenticado)
    # Remove voluntário (autenticado)
    path('voluntarios/<int:pk>/', VoluntarioDetailView.as_view(), name='voluntario_detail'),
]
