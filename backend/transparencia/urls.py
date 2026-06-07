from django.urls import path
from .views import (
    CategoriasView,
    CategoriaDetailView,
    MovimentosView,
    MovimentoDetailView,
    DocumentosInstitucionaisView,
    DocumentoInstitucionalDetailView,
)

app_name = "transparencia"

urlpatterns = [
    path("categorias/", CategoriasView.as_view(), name="categorias"),
    path("categorias/<int:pk>/", CategoriaDetailView.as_view(), name="categoria_detail"),
    path("movimentos/", MovimentosView.as_view(), name="movimentos"),
    path("movimentos/<int:pk>/", MovimentoDetailView.as_view(), name="movimento_detail"),
    path("documentos/", DocumentosInstitucionaisView.as_view(), name="documentos"),
    path("documentos/<int:pk>/", DocumentoInstitucionalDetailView.as_view(), name="documento_detail"),
]
