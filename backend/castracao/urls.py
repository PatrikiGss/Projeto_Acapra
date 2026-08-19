from django.urls import path

from .views import CastracaoDetailView, CastracoesView

app_name = 'castracao'

urlpatterns = [
    # Lista os pedidos (admin) / cria novo pedido (público)
    path('castracoes/', CastracoesView.as_view(), name='castracoes'),
    # Detalhe, atualização de andamento e remoção (admin)
    path('castracoes/<int:pk>/', CastracaoDetailView.as_view(), name='castracao_detail'),
]
