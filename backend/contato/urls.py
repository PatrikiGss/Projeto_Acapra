from django.urls import path
from .views import ContatoView

app_name = 'contato'

urlpatterns = [
    path('', ContatoView.as_view(), name='contato'),
]
