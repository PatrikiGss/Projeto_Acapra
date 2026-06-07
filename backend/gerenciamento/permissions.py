from rest_framework.permissions import BasePermission

from .models import PerfilAdministrativo

MODULOS_POR_NIVEL = {
    PerfilAdministrativo.Nivel.MASTER: {
        "doacoes",
        "noticias",
        "resgates",
        "campanhas",
        "adocao",
        "vendas",
        "voluntariado",
        "transparencia",
        "gerenciamento_usuarios",
    },
    PerfilAdministrativo.Nivel.FINANCEIRO: {"doacoes", "transparencia"},
    PerfilAdministrativo.Nivel.DOACOES: {"adocao", "noticias"},
    PerfilAdministrativo.Nivel.USUARIO: set(),
}

NIVEIS_COM_DASHBOARD = {
    PerfilAdministrativo.Nivel.MASTER,
    PerfilAdministrativo.Nivel.FINANCEIRO,
    PerfilAdministrativo.Nivel.DOACOES,
}


def get_nivel_usuario(user):
    if not user or not user.is_authenticated:
        return PerfilAdministrativo.Nivel.USUARIO

    perfil = getattr(user, "perfil_admin", None)
    if perfil is None or not perfil.ativo:
        return PerfilAdministrativo.Nivel.USUARIO

    return perfil.nivel


def usuario_pode_gerenciar_modulo(user, modulo):
    nivel = get_nivel_usuario(user)
    return modulo in MODULOS_POR_NIVEL.get(nivel, set())


def get_modulos_usuario(user):
    nivel = get_nivel_usuario(user)
    return sorted(MODULOS_POR_NIVEL.get(nivel, set()))


class IsMaster(BasePermission):
    def has_permission(self, request, view):
        return get_nivel_usuario(request.user) == PerfilAdministrativo.Nivel.MASTER


class TemAcessoDashboard(BasePermission):
    def has_permission(self, request, view):
        return get_nivel_usuario(request.user) in NIVEIS_COM_DASHBOARD


def require_module(modulo):
    class ModulePermission(BasePermission):
        def has_permission(self, request, view):
            return usuario_pode_gerenciar_modulo(request.user, modulo)

    ModulePermission.__name__ = f"CanManage{modulo.title()}Permission"
    return ModulePermission
