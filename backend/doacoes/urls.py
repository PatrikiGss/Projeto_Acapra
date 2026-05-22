from django.urls import path
from .views import DadosPixView, DadosPixDetailView

app_name='doacoes'

urlpatterns = [
    # Lista todos os dados de Pix ativos
    path('pix/', DadosPixView.as_view(), name='dados_pix'),
    # Busca um dado de Pix específico
    path('pix/<int:pk>/', DadosPixDetailView.as_view(), name='dados_pix_detail'),
]