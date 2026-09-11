from django.urls import path

from .views import RegistrosAuditoriaView

app_name = "auditoria"

urlpatterns = [
    path("registros/", RegistrosAuditoriaView.as_view(), name="registros"),
]
