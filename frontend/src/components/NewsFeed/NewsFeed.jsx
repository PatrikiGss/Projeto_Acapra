import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { getMediaURL } from "../../services/api";
import { useAdminAccess } from "../../hooks/useAdminAccess";
import LoadingSpinner from "../ui/LoadingSpinner";
import EmptyState from "../ui/EmptyState";
import ConfirmModal from "../ui/ConfirmModal";
import { getResponseItems } from "../../utils/collection";
import { getApiErrorMessage } from "../../utils/errorUtils";
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

function NewsFeed({ categoria, titulo, subtitulo, basePath, embedded = false, linkBase }) {
  const navigate = useNavigate();
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [acaoErro, setAcaoErro] = useState("");
  const [confirmacao, setConfirmacao] = useState(null);
  const { podeEditar } = useAdminAccess(categoria || "");

  const rotaCategoria = basePath && categoria ? `${basePath}/${categoria}` : (basePath || `/${categoria || ""}`);
  const resolverLinkItem = (id) => linkBase ? `${linkBase}/${id}` : `${rotaCategoria}/${id}`;

  useEffect(() => {
    const controller = new AbortController();

    const carregar = async () => {
      setLoading(true);
      setAcaoErro("");

      try {
        const params = categoria ? { categoria } : {};
        const response = await api.get("/api/noticias/publicacoes/", {
          params,
          signal: controller.signal,
        });

        setItens(getResponseItems(response.data));
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
  }, [categoria]);

  const abrirCriacao = () => {
    navigate(`${rotaCategoria}/nova`);
  };

  const abrirEdicao = (item) => {
    navigate(`${rotaCategoria}/${item.id}/editar`);
  };

  const solicitarExclusao = (item) => {
    setConfirmacao(item);
  };

  const excluirItem = async () => {
    if (!confirmacao) return;

    try {
      await api.delete(`/api/noticias/publicacoes/${confirmacao.id}/`);
      setItens((atual) => atual.filter((publicacao) => publicacao.id !== confirmacao.id));
      setConfirmacao(null);
    } catch (erro) {
      console.error(erro);
      setConfirmacao(null);
      setAcaoErro(getApiErrorMessage(erro, "Não foi possível excluir a publicação."));
    }
  };

  return (
    <section className={`news-page ${embedded ? "embedded" : ""}`}>
      <div className="news-content">
        <header className="news-hero">
          <div className="news-hero-row">
            <div className="news-hero-copy">
              <h1>{titulo}</h1>
              <p>{subtitulo}</p>
            </div>

            {podeEditar && categoria && (
              <button type="button" className="news-admin-button" onClick={abrirCriacao}>
                Nova publicação
              </button>
            )}
          </div>
        </header>

        {loading && <LoadingSpinner label="Carregando publicações..." />}

        {!loading && error && (
          <EmptyState
            title="Não foi possível carregar as publicações."
            description="Tente novamente em instantes."
          />
        )}

        {!loading && !error && itens.length === 0 && (
          <EmptyState
            title="Nenhuma publicação encontrada."
            description="Ainda não há conteúdo cadastrado para esta seção."
          />
        )}

        {!loading && !error && itens.length > 0 && (
          <div className="news-list">
            {itens.map((item) => (
              <article className="news-row" key={item.id}>
                <Link className="news-row-link" to={resolverLinkItem(item.id)}>
                  <div className="news-row-image">
                    {item.foto ? (
                      <img src={getMediaURL(item.foto)} alt={item.titulo} width="560" height="315" />
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
                      onClick={() => solicitarExclusao(item)}
                    >
                      Excluir
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}

        {acaoErro && <p className="news-message">{acaoErro}</p>}

        <ConfirmModal
          open={Boolean(confirmacao)}
          title="Excluir publicação"
          message={`Tem certeza que deseja excluir "${confirmacao?.titulo || ""}"?`}
          confirmLabel="Excluir"
          onClose={() => setConfirmacao(null)}
          onConfirm={excluirItem}
        />
      </div>
    </section>
  );
}

export default NewsFeed;
