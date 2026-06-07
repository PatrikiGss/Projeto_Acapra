from django.urls import path
from .views import CategoriasView, CategoriaDetailView, MovimentosView, MovimentoDetailView

app_name = "transparencia"

urlpatterns = [
    path("categorias/", CategoriasView.as_view(), name="categorias"),
    path("categorias/<int:pk>/", CategoriaDetailView.as_view(), name="categoria_detail"),
    path("movimentos/", MovimentosView.as_view(), name="movimentos"),
    path("movimentos/<int:pk>/", MovimentoDetailView.as_view(), name="movimento_detail"),
]