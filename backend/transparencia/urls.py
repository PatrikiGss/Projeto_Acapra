from django.urls import path
from .views import (
    CategoriasView,
    CategoriaDetailView,
    MovimentosView,
    MovimentoDetailView,
    DocumentosInstitucionaisView,
    DocumentoInstitucionalDetailView,
    IndicadoresView,
    IndicadorDetailView,
)

app_name = "transparencia"

urlpatterns = [
    path("categorias/", CategoriasView.as_view(), name="categorias"),
    path("categorias/<int:pk>/", CategoriaDetailView.as_view(), name="categoria_detail"),
    path("movimentos/", MovimentosView.as_view(), name="movimentos"),
    path("movimentos/<int:pk>/", MovimentoDetailView.as_view(), name="movimento_detail"),
    path("documentos/", DocumentosInstitucionaisView.as_view(), name="documentos"),
    path("documentos/<int:pk>/", DocumentoInstitucionalDetailView.as_view(), name="documento_detail"),
    path("indicadores/", IndicadoresView.as_view(), name="indicadores"),
    path("indicadores/<int:pk>/", IndicadorDetailView.as_view(), name="indicador_detail"),
]
