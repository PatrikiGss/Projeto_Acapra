from django.urls import path
from .views import (AnimaisView,AnimalDetailView)

app_name='adocao'

urlpatterns = [
    # Lista todos os animais
    # Cria novo animal
    path('animais/',AnimaisView.as_view(),name='animais'),
    # Busca animal específico
    # Atualiza animal
    # Remove animal
    path('animais/<int:pk>/',AnimalDetailView.as_view(),name='animal_detail'),
]