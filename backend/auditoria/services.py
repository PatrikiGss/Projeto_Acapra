"""
Helper para registrar ações na trilha de auditoria.

Uso (dentro de uma view, onde há `request`):

    from auditoria.models import RegistroAuditoria
    from auditoria.services import registrar_auditoria

    registrar_auditoria(request, obj, RegistroAuditoria.Acao.CRIADO)
"""
import logging

from .models import RegistroAuditoria

logger = logging.getLogger(__name__)


def _usuario_de(request):
    user = getattr(request, "user", None)
    if user is not None and getattr(user, "is_authenticated", False):
        return user
    return None


def registrar_auditoria(request, instancia, acao, descricao=None, alteracoes=None):
    """
    Cria um registro de auditoria para `instancia`.

    A auditoria é complementar: se algo falhar aqui, apenas registramos o
    erro no log e seguimos — nunca derrubamos a operação principal.
    """
    try:
        usuario = _usuario_de(request)
        RegistroAuditoria.objects.create(
            acao=acao,
            modelo=instancia.__class__.__name__,
            objeto_id=str(getattr(instancia, "pk", "") or ""),
            descricao=(descricao or str(instancia))[:255],
            usuario=usuario,
            usuario_email=getattr(usuario, "email", "") or "",
            alteracoes=alteracoes,
        )
    except Exception:  # noqa: BLE001 - auditoria nunca pode quebrar o fluxo
        logger.exception("Falha ao registrar auditoria de %s", acao)
