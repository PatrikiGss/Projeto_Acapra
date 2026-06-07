import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api, { getMediaURL } from "../../services/api";
import { useAdminAccess } from "../../hooks/useAdminAccess";
import LoadingSpinner from "../ui/LoadingSpinner";
import EmptyState from "../ui/EmptyState";
import ConfirmModal from "../ui/ConfirmModal";
import { getApiErrorMessage } from "../../utils/errorUtils";
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
  const [erroAcao, setErroAcao] = useState("");
  const [confirmacao, setConfirmacao] = useState(false);
  const { podeEditar } = useAdminAccess(categoria);
  const rotaCategoria = basePath ? `${basePath}/${categoria}` : `/${categoria}`;

  useEffect(() => {
    const controller = new AbortController();

    const carregar = async () => {
      setLoading(true);

      try {
        const response = await api.get(`/api/noticias/publicacoes/${id}/`, {
          signal: controller.signal,
        });
        setItem(response.data || null);
        setError(false);
      } catch (erro) {
        if (controller.signal.aborted) return;
        console.error(erro);
        setError(true);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    carregar();

    return () => {
      controller.abort();
    };
  }, [id]);

  const categoriaLabel = useMemo(
    () => categoriaLabels[categoria] || "Publicação",
    [categoria]
  );

  const excluirItem = async () => {
    if (!item) return;

    try {
      await api.delete(`/api/noticias/publicacoes/${item.id}/`);
      navigate(backPath);
    } catch (erro) {
      setErroAcao(getApiErrorMessage(erro, "Não foi possível excluir a publicação."));
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
        {loading && <LoadingSpinner label="Carregando publicação..." />}

        {!loading && error && (
          <EmptyState
            title="Não foi possível carregar esta publicação."
            description="Verifique a conexão e tente novamente."
          />
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
                <img src={getMediaURL(item.foto)} alt={item.titulo} width="1200" height="675" />
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
                <button
                  type="button"
                  className="news-article-action delete"
                  onClick={() => setConfirmacao(true)}
                >
                  Excluir
                </button>
              </div>
            )}

            {erroAcao && <p className="news-article-error">{erroAcao}</p>}
          </article>
        )}

        <ConfirmModal
          open={confirmacao}
          title="Excluir publicação"
          message={`Tem certeza que deseja excluir "${item?.titulo || ""}"?`}
          confirmLabel="Excluir"
          onClose={() => setConfirmacao(false)}
          onConfirm={excluirItem}
        />
      </div>
    </section>
  );
}

export default NewsArticle;
