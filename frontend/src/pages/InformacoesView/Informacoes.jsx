import { useMemo, useState } from "react";
import NewsFeed from "../../components/NewsFeed/NewsFeed";
import "./Informacoes.css";

const abas = [
  {
    id: null,
    label: "Todas",
    titulo: null,
    subtitulo: null,
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
  {
    id: "desaparecidos",
    label: "Desaparecidos",
    titulo: "Animais Desaparecidos",
    subtitulo: "Ajude a encontrar animais perdidos em São Joaquim e região.",
  },
];

function Informacoes() {
  const [abaAtiva, setAbaAtiva] = useState(null);

  const abaSelecionada = useMemo(
    () => abas.find((aba) => aba.id === abaAtiva) || abas[0],
    [abaAtiva],
  );

  return (
    <div className="informacoes-page">
      <header className="informacoes-header">
     
        <h1>Notícias da ACAPRA!</h1>
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
            key={String(aba.id)}
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
        linkBase="/noticias"
        embedded
      />
    </div>
  );
}

export default Informacoes;
