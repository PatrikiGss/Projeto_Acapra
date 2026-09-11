from django.urls import path

from .views import DenunciasView, DenunciaDetailView

app_name = "denuncias"

urlpatterns = [
    path("denuncias/", DenunciasView.as_view(), name="denuncias"),
    path("denuncias/<int:pk>/", DenunciaDetailView.as_view(), name="denuncia-detail"),
]
