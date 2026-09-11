import { useMemo, useState } from "react";
import NewsFeed from "../../components/NewsFeed/NewsFeed";
import "../InformacoesView/Informacoes.css";

const categorias = [
  {
    id: null,
    label: "Todas",
    subtitulo: "Todas as publicações da ACAPRA.",
  },
  {
    id: "resgates",
    label: "Resgates",
    subtitulo: "Histórias de cuidado, acolhimento e recomeço.",
  },
  {
    id: "campanhas",
    label: "Campanhas",
    subtitulo: "Ações, mobilizações e chamadas para ajudar os animais.",
  },
  {
    id: "desaparecidos",
    label: "Desaparecidos",
    subtitulo: "Ajude a encontrar animais perdidos em São Joaquim e região.",
  },
];

function Noticias() {
  const [filtro, setFiltro] = useState(null);

  const categoriaAtiva = useMemo(
    () => categorias.find((c) => c.id === filtro) || categorias[0],
    [filtro],
  );

  return (
    <div className="informacoes-page">
      <header className="informacoes-header">
        <span className="section-kicker">Notícias</span>
        <h1>Novidades, resgates e campanhas</h1>
        <p>Acompanhe em um só lugar as principais publicações da ACAPRA.</p>
      </header>

      <div className="informacoes-tabs" role="tablist" aria-label="Filtrar por categoria">
        {categorias.map((c) => (
          <button
            className={c.id === filtro ? "active" : ""}
            type="button"
            role="tab"
            aria-selected={c.id === filtro}
            onClick={() => setFiltro(c.id)}
            key={String(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>

      <NewsFeed
        categoria={filtro}
        titulo={categoriaAtiva.label}
        subtitulo={categoriaAtiva.subtitulo}
        basePath="/noticias"
        linkBase="/noticias"
        embedded
      />
    </div>
  );
}

export default Noticias;
