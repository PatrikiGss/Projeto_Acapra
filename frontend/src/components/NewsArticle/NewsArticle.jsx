import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api, { getMediaURL } from "../../services/api";
import { useAdminAccess } from "../../hooks/useAdminAccess";
import "./NewsArticle.css";

const categoriaLabels = {
  noticias: "Notícias",
  resgates: "Resgates",
  campanhas: "Campanhas",
};

function formatarData(valor) {
  if (!valor) return "";

  const data = new Date(valor);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(data);
}

function NewsArticle({ categoria, backPath, basePath }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { podeEditar } = useAdminAccess(categoria);
  const rotaCategoria = basePath ? `${basePath}/${categoria}` : `/${categoria}`;

  useEffect(() => {
    let ignorado = false;

    Promise.resolve().then(async () => {
      if (ignorado) return;

      setLoading(true);

      try {
        const response = await api.get(`/api/noticias/publicacoes/${id}/`);
        if (ignorado) return;
        setItem(response.data || null);
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
  }, [id]);

  const categoriaLabel = useMemo(
    () => categoriaLabels[categoria] || "Publicação",
    [categoria]
  );

  const excluirItem = async () => {
    if (!item) return;

    const confirmado = window.confirm(`Excluir a publicação "${item.titulo}"?`);
    if (!confirmado) return;

    try {
      await api.delete(`/api/noticias/publicacoes/${item.id}/`);
      navigate(backPath);
    } catch (erro) {
      alert("Não foi possível excluir a publicação.");
      console.error(erro);
    }
  };

  const editarItem = () => {
    if (!item) return;
    navigate(`${rotaCategoria}/${item.id}/editar`);
  };

  return (
    <section className="news-article-page">
      <div className="news-article-shell">
        {loading && <div className="news-article-message">Carregando publicação...</div>}

        {!loading && error && (
          <div className="news-article-message">Não foi possível carregar esta publicação.</div>
        )}

        {!loading && !error && item && (
          <article className="news-article">
            <div className="news-article-meta">
              <span>{item.categoria_display || categoriaLabel}</span>
              {item.created_at && <time>{formatarData(item.created_at)}</time>}
            </div>

            <h1 className="news-article-title">{item.titulo}</h1>

            <p className="news-article-summary">{item.resumo}</p>

            <div className="news-article-divider" />

            <div className="news-article-image">
              {item.foto ? (
                <img src={getMediaURL(item.foto)} alt={item.titulo} />
              ) : (
                <div className="news-article-placeholder">ACAPRA</div>
              )}
            </div>

            <div className="news-article-text">
              {item.texto}
            </div>

            {podeEditar && (
            <div className="news-article-actions">
              <button type="button" className="news-article-action edit" onClick={editarItem}>
                Editar
              </button>
              <button type="button" className="news-article-action delete" onClick={excluirItem}>
                Excluir
              </button>
              </div>
            )}
          </article>
        )}
      </div>
    </section>
  );
}

export default NewsArticle;
