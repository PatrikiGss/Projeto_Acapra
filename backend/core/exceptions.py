"""
Handler global de exceções do DRF.

Garante que nenhuma exceção não tratada vaze detalhes internos (stack trace,
mensagens do banco, mensagens do Python) para o cliente. Exceções conhecidas do
DRF (validação, permissão, 404, throttling, etc.) continuam retornando suas
respostas normais; exceções inesperadas viram um 500 genérico, com o detalhe
completo registrado apenas no log do servidor.
"""
import logging

from rest_framework.views import exception_handler as drf_exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger("acapra.security")


def custom_exception_handler(exc, context):
    response = drf_exception_handler(exc, context)

    if response is not None:
        # Exceção tratada pelo DRF (4xx). Mantém o corpo, mas evita expor
        # detalhes sensíveis em respostas de erro de servidor.
        return response

    # Exceção inesperada: loga o detalhe completo no servidor e responde
    # com mensagem genérica.
    import traceback, sys
    view = context.get("view").__class__.__name__ if context.get("view") else "?"
    logger.exception("Erro não tratado em %s: %s", view, exc.__class__.__name__)
    print(f"\n[ERRO 500] {view}: {exc.__class__.__name__}: {exc}", file=sys.stderr)
    traceback.print_exc(file=sys.stderr)

    return Response(
        {"detail": "Erro interno do servidor."},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
