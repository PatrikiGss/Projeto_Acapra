import { useState } from "react";

/**
 * Paginação no cliente.
 *
 * Recebe a lista já filtrada/ordenada e devolve apenas a fatia da página atual
 * (`itensPagina`) + os controles. Por padrão reseta para a 1ª página sempre
 * que a lista muda (troca de filtro, busca, ordenação ou recarga dos dados),
 * por isso o chamador deve memoizar `itens` para não resetar a cada render.
 *
 * @param {Array} itens    Lista completa a paginar.
 * @param {number} porPagina  Máximo de itens por página (padrão 12).
 * @param {*} chaveReset  Valor que, ao mudar, volta para a 1ª página (padrão:
 *   a própria lista). Útil quando a lista recarrega após editar um item e o
 *   usuário deve continuar na página em que estava.
 */
export function usePaginacao(itens, porPagina = 12, chaveReset = itens) {
  const [pagina, setPagina] = useState(1);

  const totalPaginas = Math.max(1, Math.ceil(itens.length / porPagina));

  // Reset durante o render (padrão recomendado pelo React para ajustar estado
  // quando uma prop muda) — evita o render extra de um useEffect.
  const [chaveAnterior, setChaveAnterior] = useState(chaveReset);
  if (chaveReset !== chaveAnterior) {
    setChaveAnterior(chaveReset);
    setPagina(1);
  }

  // Protege contra página fora do intervalo (ex.: a lista encolheu).
  const paginaAtual = Math.min(pagina, totalPaginas);
  const inicio = (paginaAtual - 1) * porPagina;
  const itensPagina = itens.slice(inicio, inicio + porPagina);

  return { pagina: paginaAtual, setPagina, totalPaginas, itensPagina };
}
