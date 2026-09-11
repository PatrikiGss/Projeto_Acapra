from django.urls import path
from .views import (
    DocumentosInstitucionaisView,
    DocumentoInstitucionalDetailView,
    IndicadoresView,
    IndicadorDetailView,
)

app_name = "transparencia"

urlpatterns = [
    path("documentos/", DocumentosInstitucionaisView.as_view(), name="documentos"),
    path("documentos/<int:pk>/", DocumentoInstitucionalDetailView.as_view(), name="documento_detail"),
    path("indicadores/", IndicadoresView.as_view(), name="indicadores"),
    path("indicadores/<int:pk>/", IndicadorDetailView.as_view(), name="indicador_detail"),
]
