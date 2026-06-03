from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AnimalViewSet

app_name = 'adocao' 

router = DefaultRouter()
router.register(r'animais', AnimalViewSet)

urlpatterns = [
    path('', include(router.urls)),
]