import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api, { getMediaURL } from "../../services/api";
import { useAdminAccess } from "../../hooks/useAdminAccess";
import LoadingSpinner from "../ui/LoadingSpinner";
import EmptyState from "../ui/EmptyState";
import ConfirmModal from "../ui/ConfirmModal";
import { getApiErrorMessage, isNotFoundError } from "../../utils/errorUtils";
import { getResponseItems } from "../../utils/collection";
import { logError } from "../../utils/logger";
import "./NewsArticle.css";

const categoriaLabels = {
  resgates: "Resgates",
  campanhas: "Campanhas",
  desaparecidos: "Desaparecidos",
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

function NewsArticle({ backPath }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [erroAcao, setErroAcao] = useState("");
  const [confirmacao, setConfirmacao] = useState(false);

  const categoriaEfetiva = item?.categoria || "";
  const { podeEditar } = useAdminAccess(categoriaEfetiva);
  const [relacionados, setRelacionados] = useState([]);
  const [imagemAtiva, setImagemAtiva] = useState(0);

  const fotos = useMemo(() => {
    if (!item) return [];
    if (item.fotos?.length) return item.fotos;
    return item.foto ? [item.foto] : [];
  }, [item]);

  // Volta para a primeira foto quando muda de publicação. Ajuste durante o
  // render (padrão do React), sem o render extra de um useEffect.
  const [idAnterior, setIdAnterior] = useState(item?.id);
  if (item?.id !== idAnterior) {
    setIdAnterior(item?.id);
    setImagemAtiva(0);
  }

  useEffect(() => {
    if (!item?.categoria) return;
    const controller = new AbortController();

    api
      .get("/api/noticias/publicacoes/", {
        params: { categoria: item.categoria },
        signal: controller.signal,
      })
      .then((res) => {
        const todos = getResponseItems(res.data);
        setRelacionados(todos.filter((p) => p.id !== item.id).slice(0, 3));
      })
      .catch(() => {});

    return () => controller.abort();
  }, [item?.categoria, item?.id]);

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
        logError("NewsArticle", erro);
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
    () => item?.categoria_display || categoriaLabels[categoriaEfetiva] || "Publicação",
    [item, categoriaEfetiva],
  );

  const excluirItem = async () => {
    if (!item) return;

    try {
      await api.delete(`/api/noticias/publicacoes/${item.id}/`);
    } catch (erro) {
      // 404 = publicação já não existe: segue para a navegação (já foi removida).
      if (!isNotFoundError(erro)) {
        setErroAcao(getApiErrorMessage(erro, "Não foi possível excluir a publicação."));
        logError("NewsArticle", erro);
        return;
      }
    }
    navigate(backPath || "/noticias");
  };

  const editarItem = () => {
    if (!item) return;
    navigate(`/noticias/${item.categoria}/${item.id}/editar`);
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
              <span>{categoriaLabel}</span>
              {item.created_at && <time>{formatarData(item.created_at)}</time>}
            </div>

            <h1 className="news-article-title">{item.titulo}</h1>

            <p className="news-article-summary">{item.resumo}</p>

            <div className="news-article-divider" />

            <div className="news-article-image">
              {fotos.length > 0 ? (
                <img
                  src={getMediaURL(fotos[imagemAtiva] || fotos[0])}
                  alt={item.titulo}
                  width="1200"
                  height="675"
                />
              ) : (
                <div className="news-article-placeholder">ACAPRA</div>
              )}
            </div>

            {fotos.length > 1 && (
              <div className="news-article-gallery">
                {fotos.map((foto, indice) => (
                  <button
                    type="button"
                    key={foto}
                    className={`news-article-thumb${indice === imagemAtiva ? " active" : ""}`}
                    onClick={() => setImagemAtiva(indice)}
                    aria-label={`Ver foto ${indice + 1}`}
                  >
                    <img src={getMediaURL(foto)} alt={`${item.titulo} — foto ${indice + 1}`} />
                  </button>
                ))}
              </div>
            )}

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

      {relacionados.length > 0 && (
        <div className="related-news">
          <h2 className="related-news-heading">Relacionadas</h2>
          <div className="related-news-grid">
            {relacionados.map((rel) => (
              <Link key={rel.id} className="related-card" to={`/noticias/${rel.id}`}>
                <div className="related-card-image">
                  {rel.foto ? (
                    <img src={getMediaURL(rel.foto)} alt={rel.titulo} width="560" height="315" />
                  ) : (
                    <div className="related-card-placeholder">ACAPRA</div>
                  )}
                </div>
                <div className="related-card-body">
                  <span className="related-card-cat">{rel.categoria_display}</span>
                  <h3 className="related-card-title">{rel.titulo}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default NewsArticle;
