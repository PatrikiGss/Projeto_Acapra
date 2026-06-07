from django.urls import path
from .views import DocumentosTransparenciaView, DocumentoTransparenciaDetailView

app_name='transparencia'

urlpatterns = [
    path("documentos/", DocumentosTransparenciaView.as_view(), name="documentos"),
    path("documentos/<int:pk>/", DocumentoTransparenciaDetailView.as_view(), name="documento-detail"),
]
