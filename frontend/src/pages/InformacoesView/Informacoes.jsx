import { useMemo, useState } from "react";
import NewsFeed from "../../components/NewsFeed/NewsFeed";
import "./Informacoes.css";

const abas = [
  {
    id: "noticias",
    label: "Notícias",
    titulo: "Notícias",
    subtitulo: "Atualizações, comunicados e boas histórias da ACAPRA.",
  },
  {
    id: "resgates",
    label: "Resgates",
    titulo: "Resgates",
    subtitulo: "Histórias de cuidado, acolhimento e recomeço.",
  },
  {
    id: "campanhas",
    label: "Campanhas",
    titulo: "Campanhas",
    subtitulo: "Ações, mobilizações e chamadas para ajudar os animais.",
  },
];

function Informacoes() {
  const [abaAtiva, setAbaAtiva] = useState("noticias");

  const abaSelecionada = useMemo(
    () => abas.find((aba) => aba.id === abaAtiva) || abas[0],
    [abaAtiva],
  );

  return (
    <div className="informacoes-page">
      <header className="informacoes-header">
        <span className="section-kicker">Informações</span>
        <h1>Novidades, resgates e campanhas</h1>
        <p>
          Acompanhe em um só lugar as principais publicações da ACAPRA.
        </p>
      </header>

      <div className="informacoes-tabs" role="tablist" aria-label="Categorias de informações">
        {abas.map((aba) => (
          <button
            className={aba.id === abaAtiva ? "active" : ""}
            type="button"
            role="tab"
            aria-selected={aba.id === abaAtiva}
            onClick={() => setAbaAtiva(aba.id)}
            key={aba.id}
          >
            {aba.label}
          </button>
        ))}
      </div>

      <NewsFeed
        categoria={abaSelecionada.id}
        titulo={abaSelecionada.titulo}
        subtitulo={abaSelecionada.subtitulo}
        basePath="/informacoes"
        embedded
      />
    </div>
  );
}

export default Informacoes;
