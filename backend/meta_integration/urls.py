from django.urls import path
from . import views

app_name = 'meta_integration'

urlpatterns = [
    path('auth/initiate/', views.InitiateOAuthView.as_view(), name='initiate'),
    path('auth/callback/', views.meta_callback, name='callback'),
    path('pages/', views.MetaPagesView.as_view(), name='pages'),
    path('save/', views.MetaSaveConnectionView.as_view(), name='save'),
    path('status/', views.MetaStatusView.as_view(), name='status'),
    path('disconnect/<int:pk>/', views.MetaDisconnectView.as_view(), name='disconnect'),
]
