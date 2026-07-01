import "./Paginacao.css";

// Gera a sequência de páginas a exibir; com muitas páginas, usa reticências
// mantendo sempre a primeira, a última e a vizinhança da atual.
function gerarPaginas(atual, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const numeros = [...new Set([1, atual - 1, atual, atual + 1, total])]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);

  const resultado = [];
  let anterior = 0;
  for (const p of numeros) {
    if (p - anterior > 1) resultado.push("...");
    resultado.push(p);
    anterior = p;
  }
  return resultado;
}

function Paginacao({ pagina, totalPaginas, onMudar }) {
  if (totalPaginas <= 1) return null;

  const irPara = (destino) => {
    if (destino < 1 || destino > totalPaginas || destino === pagina) return;
    onMudar(destino);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <nav className="paginacao" aria-label="Paginação">
      <button
        type="button"
        className="paginacao-btn"
        onClick={() => irPara(pagina - 1)}
        disabled={pagina === 1}
        aria-label="Página anterior"
      >
        ‹
      </button>

      {gerarPaginas(pagina, totalPaginas).map((p, indice) =>
        p === "..." ? (
          <span key={`gap-${indice}`} className="paginacao-gap" aria-hidden="true">…</span>
        ) : (
          <button
            type="button"
            key={p}
            className={`paginacao-btn${p === pagina ? " active" : ""}`}
            onClick={() => irPara(p)}
            aria-current={p === pagina ? "page" : undefined}
          >
            {p}
          </button>
        ),
      )}

      <button
        type="button"
        className="paginacao-btn"
        onClick={() => irPara(pagina + 1)}
        disabled={pagina === totalPaginas}
        aria-label="Próxima página"
      >
        ›
      </button>
    </nav>
  );
}

export default Paginacao;
