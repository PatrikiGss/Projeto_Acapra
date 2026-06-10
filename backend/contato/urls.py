from rest_framework.routers import DefaultRouter
from .views import ContatoViewSet

router = DefaultRouter()
router.register(r'contatos', ContatoViewSet)

urlpatterns = router.urls