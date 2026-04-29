from rest_framework.routers import DefaultRouter
from .views import PerfilAdministrativoViewSet


"""
Arquivo responsável pelas rotas da app gerenciamento.

====================================================
Rotas geradas 
====================================================

/gerenciamento/perfil-administrativo/
/gerenciamento/perfil-administrativo/{id}/

com suporte a:

GET
POST
PUT
PATCH
DELETE
"""

app_name = "gerenciamento"

router = DefaultRouter()

router.register(
    r'perfil-administrativo',
    PerfilAdministrativoViewSet,
    basename='perfil-administrativo'
)

urlpatterns = router.urls