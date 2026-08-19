from rest_framework.permissions import BasePermission

from .models import PerfilAdministrativo

# Define quais módulos cada nível administrativo pode gerenciar.
# Hierarquia (do maior para o menor acesso):
#   DIRETOR_ACAPRA  -> acesso total, inclusive gerenciamento de usuários
#   TESOUREIRO      -> tudo, exceto gerenciamento de usuários
#   ADMIN           -> operação geral, sem área financeira (doações)
#   AUXILIAR_GERAL  -> apenas módulos operacionais do dia a dia
#   USUARIO         -> sem acesso administrativo
MODULOS_POR_NIVEL = {
    PerfilAdministrativo.Nivel.DIRETOR_ACAPRA: {
        "doacoes",
        "noticias",
        "resgates",
        "campanhas",
        "adocao",
        "vendas",
        "voluntariado",
        "castracao",
        "gerenciamento_usuarios",
        "transparencia",
        "denuncias",
    },
    PerfilAdministrativo.Nivel.TESOUREIRO: {
        "doacoes",
        "noticias",
        "resgates",
        "campanhas",
        "adocao",
        "vendas",
        "voluntariado",
        "castracao",
        "transparencia",
        "denuncias",
    },
    PerfilAdministrativo.Nivel.ADMIN: {
        "noticias",
        "resgates",
        "campanhas",
        "adocao",
        "vendas",
        "voluntariado",
        "castracao",
        "transparencia",
        "denuncias",
    },
    PerfilAdministrativo.Nivel.AUXILIAR_GERAL: {
        "noticias",
        "resgates",
        "campanhas",
        "adocao",
        "vendas",
        "voluntariado",
        "castracao",
    },
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


class IsDiretor(BasePermission):
    """Acesso exclusivo do Diretor Acapra (nível máximo)."""

    def has_permission(self, request, view):
        return get_nivel_usuario(request.user) == PerfilAdministrativo.Nivel.DIRETOR_ACAPRA


class TemAcessoDashboard(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated


def require_module(modulo):
    class ModulePermission(BasePermission):
        def has_permission(self, request, view):
            return usuario_pode_gerenciar_modulo(request.user, modulo)

    ModulePermission.__name__ = f"CanManage{modulo.title()}Permission"
    return ModulePermission
