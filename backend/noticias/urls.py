from django.urls import path

from .views import PublicacaoDetailView, PublicacoesView

app_name = "noticias"

urlpatterns = [
    path("publicacoes/", PublicacoesView.as_view(), name="publicacoes"),
    path("publicacoes/<int:pk>/", PublicacaoDetailView.as_view(), name="publicacao_detail"),
]
