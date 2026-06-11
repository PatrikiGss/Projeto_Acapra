from django.urls import path
from .views import (
    AdminPerfilUpdateView,
    AdminUsuariosView,
    ChangePasswordView,
    DashboardView,
    MeuPerfilView,
    RegisterView,
    ThrottledLoginView,
    ThrottledRefreshView,
)

from rest_framework_simplejwt.views import (
    TokenBlacklistView
)

# Namespace da app (usado para reverse e organização de rotas)
app_name = 'gerenciamento'

urlpatterns = [

    # =========================
    # AUTENTICAÇÃO
    # =========================

    # Registro de novos usuários
    # Público (não requer autenticação)
    path('auth/register/', RegisterView.as_view(), name='register'),

    # Login JWT (com rate limiting por IP)
    # Retorna access + refresh token
    path('auth/login/', ThrottledLoginView.as_view(), name='login'),

    # Refresh do token (com rate limiting por IP)
    # Usa refresh token para gerar novo access token
    path('auth/refresh/', ThrottledRefreshView.as_view(), name='token_refresh'),

    # Logout (blacklist do refresh token)
    # Requer envio do refresh token no body
    path('auth/logout/', TokenBlacklistView.as_view(), name='logout'),


    # =========================
    # USUÁRIO AUTENTICADO
    # =========================

    # Retorna ou atualiza dados do usuário logado
    # GET -> dados
    # PUT -> atualização
    path('user/me/', MeuPerfilView.as_view(), name='me'),

    # Alteração de senha
    # Requer senha atual + nova senha válida
    path('user/change-password/', ChangePasswordView.as_view(), name='change_password'),


    # =========================
    # DASHBOARD / ADMINISTRAÇÃO
    # =========================

    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    path('admin/usuarios/', AdminUsuariosView.as_view(), name='admin_usuarios'),
    path(
        'admin/usuarios/<int:pk>/perfil/',
        AdminPerfilUpdateView.as_view(),
        name='admin_perfil_update',
    ),
]