from django.urls import path
from .views import ProdutosView, ProdutoDetailView, ProdutosPorTipoView

app_name='vendas'

urlpatterns = [
    # Lista todos os produtos ativos
    # Cria novo produto
    path('produtos/', ProdutosView.as_view(), name='produtos'),
    # Busca produto especifico
    # Atualiza produto
    # Remove produto
    path('produtos/<int:pk>/', ProdutoDetailView.as_view(), name='produto_detail'),
    # Lista produtos por tipo (humano ou pet)
    path('produtos/tipo/<str:tipo>/', ProdutosPorTipoView.as_view(), name='produtos_por_tipo'),
]