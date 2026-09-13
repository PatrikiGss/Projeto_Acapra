import { describe, it, expect } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { usePaginacao } from "../usePaginacao";

function gerarItens(total, prefixo = "item") {
  return Array.from({ length: total }, (_, i) => `${prefixo}-${i + 1}`);
}

describe("usePaginacao", () => {
  it("divide a lista em páginas de 12 itens por padrão", () => {
    const itens = gerarItens(30);
    const { result } = renderHook(() => usePaginacao(itens));

    expect(result.current.totalPaginas).toBe(3);
    expect(result.current.itensPagina).toEqual(itens.slice(0, 12));

    act(() => result.current.setPagina(3));
    expect(result.current.pagina).toBe(3);
    expect(result.current.itensPagina).toEqual(itens.slice(24));
  });

  it("lista vazia tem uma página e nenhum item", () => {
    const itens = [];
    const { result } = renderHook(() => usePaginacao(itens));

    expect(result.current.totalPaginas).toBe(1);
    expect(result.current.itensPagina).toEqual([]);
  });

  it("sem chaveReset, volta para a 1ª página quando a lista muda", () => {
    const { result, rerender } = renderHook(({ itens }) => usePaginacao(itens), {
      initialProps: { itens: gerarItens(30) },
    });

    act(() => result.current.setPagina(2));
    expect(result.current.pagina).toBe(2);

    rerender({ itens: gerarItens(30, "novo") });
    expect(result.current.pagina).toBe(1);
  });

  it("com chaveReset, recarregar a lista mantém a página e trocar a chave reseta", () => {
    const { result, rerender } = renderHook(
      ({ itens, chave }) => usePaginacao(itens, 12, chave),
      { initialProps: { itens: gerarItens(30), chave: "todos" } },
    );

    act(() => result.current.setPagina(2));

    rerender({ itens: gerarItens(30, "recarregado"), chave: "todos" });
    expect(result.current.pagina).toBe(2);
    expect(result.current.itensPagina[0]).toBe("recarregado-13");

    rerender({ itens: gerarItens(30, "recarregado"), chave: "pendente" });
    expect(result.current.pagina).toBe(1);
  });

  it("não passa da última página quando a lista encolhe", () => {
    const { result, rerender } = renderHook(
      ({ itens }) => usePaginacao(itens, 12, "fixa"),
      { initialProps: { itens: gerarItens(30) } },
    );

    act(() => result.current.setPagina(3));

    rerender({ itens: gerarItens(13) });
    expect(result.current.totalPaginas).toBe(2);
    expect(result.current.pagina).toBe(2);
    expect(result.current.itensPagina).toEqual(["item-13"]);
  });
});
