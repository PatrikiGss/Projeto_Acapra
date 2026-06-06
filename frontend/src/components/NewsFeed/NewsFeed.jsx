import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { getMediaURL } from "../../services/api";
import { useAdminAccess } from "../../hooks/useAdminAccess";
import "./NewsFeed.css";

function formatarData(valor) {
  if (!valor) return "";

  const data = new Date(valor);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(data);
}

function resumirTexto(texto) {
  if (!texto) return "";
  const limpo = texto.replace(/\s+/g, " ").trim();
  if (limpo.length <= 220) return limpo;
  return `${limpo.slice(0, 220).trimEnd()}...`;
}

function NewsFeed({ categoria, titulo, subtitulo }) {
  const navigate = useNavigate();
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { podeEditar } = useAdminAccess(categoria);

  useEffect(() => {
    let ignorado = false;

    Promise.resolve().then(async () => {
      if (ignorado) return;

      setLoading(true);

      try {
        const response = await api.get("/api/noticias/publicacoes/", {
          params: { categoria },
        });

        if (ignorado) return;
        setItens(response.data || []);
        setError(false);
      } catch (erro) {
        if (ignorado) return;
        console.error(erro);
        setError(true);
      } finally {
        if (!ignorado) {
          setLoading(false);
        }
      }
    });

    return () => {
      ignorado = true;
    };
  }, [categoria]);

  const abrirCriacao = () => {
    navigate(`/${categoria}/nova`);
  };

  const abrirEdicao = (item) => {
    navigate(`/${categoria}/${item.id}/editar`);
  };

  const excluirItem = async (item) => {
    const confirmado = window.confirm(`Excluir a publicação "${item.titulo}"?`);
    if (!confirmado) return;

    try {
      await api.delete(`/api/noticias/publicacoes/${item.id}/`);
      setItens((atual) => atual.filter((publicacao) => publicacao.id !== item.id));
    } catch (erro) {
      console.error(erro);
      alert("Não foi possível excluir a publicação.");
    }
  };

  const itensVisiveis = itens.filter((item) => item.categoria === categoria);

  return (
    <section className="news-page">
      <div className="news-content">
      <header className="news-hero">
        <div className="news-hero-row">
          <div className="news-hero-copy">
            <h1>{titulo}</h1>
            <p>{subtitulo}</p>
          </div>

          {podeEditar && (
            <button type="button" className="news-admin-button" onClick={abrirCriacao}>
              Nova publicação
            </button>
          )}
        </div>
      </header>

      {loading && <div className="news-message">Carregando publicações...</div>}

      {!loading && error && (
        <div className="news-message">Não foi possível carregar as publicações.</div>
      )}

      {!loading && !error && itensVisiveis.length === 0 && (
        <div className="news-message">Nenhuma publicação cadastrada para esta seção.</div>
      )}

      {!loading && !error && itensVisiveis.length > 0 && (
        <div className="news-list">
          {itensVisiveis.map((item) => (
            <article className="news-row" key={item.id}>
              <Link className="news-row-link" to={`/${categoria}/${item.id}`}>
                <div className="news-row-image">
                  {item.foto ? (
                    <img src={getMediaURL(item.foto)} alt={item.titulo} />
                  ) : (
                    <div className="news-placeholder">ACAPRA</div>
                  )}
                </div>

                <div className="news-row-body">
                  <div className="news-meta">
                    <span>{item.categoria_display}</span>
                    {item.created_at && <time>{formatarData(item.created_at)}</time>}
                  </div>

                  <h2>{item.titulo}</h2>
                  <p>{item.resumo || resumirTexto(item.texto)}</p>
                </div>
              </Link>

              {podeEditar && (
                <div className="news-admin-actions">
                  <button
                    type="button"
                    className="news-admin-action edit"
                    onClick={() => abrirEdicao(item)}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="news-admin-action delete"
                    onClick={() => excluirItem(item)}
                  >
                    Excluir
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
      </div>
    </section>
  );
}

export default NewsFeed;

