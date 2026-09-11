from django.urls import path
from .views import LaresView, LarDetailView

app_name = 'lares'

urlpatterns = [
    path('lares/', LaresView.as_view(), name='lares'),
    path('lares/<int:pk>/', LarDetailView.as_view(), name='lar_detail'),
]
