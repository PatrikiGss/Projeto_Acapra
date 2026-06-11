from django.urls import path
from .views import DadosPixView, DadosPixDetailView, DoacoesItemView, DoacaoItemDetailView

app_name = 'doacoes'

urlpatterns = [
    path('pix/', DadosPixView.as_view(), name='dados_pix'),
    path('pix/<int:pk>/', DadosPixDetailView.as_view(), name='dados_pix_detail'),
    path('itens/', DoacoesItemView.as_view(), name='doacoes_item'),
    path('itens/<int:pk>/', DoacaoItemDetailView.as_view(), name='doacoes_item_detail'),
]
