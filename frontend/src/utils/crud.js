import api from "../services/api";
import { getApiErrorMessage, isNotFoundError } from "./errorUtils";

/**
 * Exclusão padronizada de um recurso via API.
 *
 * - Chama `DELETE url`.
 * - Trata 404 como "já removido" (sucesso): o item não existe mais no servidor.
 * - Em sucesso (ou 404): chama `aoRemover` (remoção otimista da lista) e
 *   `recarregar` (releitura do servidor para refletir o estado real).
 * - Em erro real (500, rede, permissão): chama `aoErro(mensagem)` e NÃO remove
 *   o item, evitando esconder a falha.
 *
 * Retorna `true` se o item foi (ou já estava) removido; `false` em erro real.
 */
export async function excluirRecurso(url, { aoRemover, recarregar, aoErro, mensagemErro } = {}) {
  try {
    await api.delete(url);
  } catch (error) {
    if (!isNotFoundError(error)) {
      aoErro?.(getApiErrorMessage(error, mensagemErro));
      return false;
    }
  }

  aoRemover?.();
  recarregar?.();
  return true;
}

export default excluirRecurso;
