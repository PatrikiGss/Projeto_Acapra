from django.urls import path
from .views import (
    DadosPixView,
    DadosPixDetailView,
    OfertasDoacaoView,
    OfertaDoacaoDetailView,
)

app_name='doacoes'

urlpatterns = [
    # Lista todos os dados de Pix ativos
    path('pix/', DadosPixView.as_view(), name='dados_pix'),
    # Busca um dado de Pix específico
    path('pix/<int:pk>/', DadosPixDetailView.as_view(), name='dados_pix_detail'),
    # Ofertas de doação de itens (POST público, gestão autenticada)
    path('ofertas/', OfertasDoacaoView.as_view(), name='ofertas'),
    path('ofertas/<int:pk>/', OfertaDoacaoDetailView.as_view(), name='oferta_detail'),
]