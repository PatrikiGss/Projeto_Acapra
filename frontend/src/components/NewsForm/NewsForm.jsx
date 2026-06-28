import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import { useAdminAccess } from "../../hooks/useAdminAccess";
import LoadingSpinner from "../ui/LoadingSpinner";
import EditorImagens from "../ui/EditorImagens";
import { useEditorImagens } from "../../hooks/useEditorImagens";
import { getApiErrorMessage } from "../../utils/errorUtils";
import { logError } from "../../utils/logger";
import "./NewsForm.css";

const categoriaLabels = {
  resgates: "Resgates",
  campanhas: "Campanhas",
  desaparecidos: "Desaparecidos",
};

const formVazio = {
  titulo: "",
  resumo: "",
  texto: "",
  ativo: true,
};

const LIMITE_FOTOS = 4;

function NewsForm({ categoria, backPath, mode = "create" }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const { podeEditar } = useAdminAccess(categoria);
  const rotaCategoria = `/noticias/${categoria}`;
  const [loading, setLoading] = useState(mode === "edit");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [item, setItem] = useState(null);
  const [formulario, setFormulario] = useState(formVazio);
  const editorImagens = useEditorImagens(LIMITE_FOTOS);

  const categoriaLabel = useMemo(
    () => categoriaLabels[categoria] || "Publicação",
    [categoria]
  );

  useEffect(() => {
    const controller = new AbortController();

    if (mode !== "edit" || !id) {
      return () => {
        controller.abort();
      };
    }

    const carregar = async () => {
      setLoading(true);

      try {
        const response = await api.get(`/api/noticias/publicacoes/${id}/`, {
          signal: controller.signal,
        });

        const data = response.data || null;
        setItem(data);
        setFormulario({
          titulo: data?.titulo || "",
          resumo: data?.resumo || "",
          texto: data?.texto || "",
          ativo: Boolean(data?.ativo ?? true),
        });
        editorImagens.reiniciar(data?.galeria || []);
      } catch (error) {
        if (controller.signal.aborted) return;
        logError("NewsForm", error);
        setErro("Não foi possível carregar a publicação.");
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
  }, [id, mode]);

  const alterarCampo = (event) => {
    const { name, value, type, checked } = event.target;
    const novoValor = type === "checkbox" ? checked : value;
    setFormulario((atual) => ({
      ...atual,
      [name]: novoValor,
    }));
  };

  const extrairMensagemErro = (errorResponse) => {
    return getApiErrorMessage(errorResponse, "Não foi possível salvar a publicação.");
  };

  const enviarFormulario = async (event) => {
    event.preventDefault();
    setErro("");

    if (!editorImagens.temImagens) {
      setErro("Adicione pelo menos uma foto para a publicação.");
      return;
    }

    setSalvando(true);

    const payload = new FormData();
    payload.append("categoria", categoria);
    payload.append("titulo", formulario.titulo);
    payload.append("resumo", formulario.resumo);
    payload.append("texto", formulario.texto);
    payload.append("ativo", formulario.ativo ? "true" : "false");

    editorImagens.anexarAoFormData(payload);

    try {
      let response;

      if (mode === "edit" && item) {
        response = await api.patch(`/api/noticias/publicacoes/${item.id}/`, payload);
      } else {
        response = await api.post("/api/noticias/publicacoes/", payload);
      }

      navigate(`/noticias/${response.data.id}`);
    } catch (error) {
      setErro(extrairMensagemErro(error));
    } finally {
      setSalvando(false);
    }
  };

  if (!podeEditar) {
    return (
      <section className="news-form-page">
        <div className="news-form-shell">
          <div className="news-form-message">
            Você não possui permissão para criar ou editar publicações nesta seção.
          </div>
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="news-form-page">
        <div className="news-form-shell">
          <LoadingSpinner label="Carregando publicação..." />
        </div>
      </section>
    );
  }

  return (
    <section className="news-form-page">
      <div className="news-form-shell">
        <form className="news-form-editor" onSubmit={enviarFormulario}>
          <div className="news-form-heading">
            <span className="news-form-kicker">ACAPRA • {categoriaLabel}</span>
            <input
              className="news-form-title"
              name="titulo"
              value={formulario.titulo}
              onChange={alterarCampo}
              placeholder="Digite o título da publicação"
              required
            />
          </div>

          <label className="news-form-summary">
            <span>Resumo da publicação</span>
            <textarea
              name="resumo"
              rows="4"
              value={formulario.resumo}
              onChange={alterarCampo}
              placeholder="Escreva um resumo curto que aparece logo abaixo do título"
              required
            />
          </label>

          <div className="news-form-image-editor">
            <EditorImagens api={editorImagens} label="Fotos da publicação" />
          </div>

          <label className="news-form-text">
            <span>Texto da publicação</span>
            <textarea
              name="texto"
              rows="14"
              value={formulario.texto}
              onChange={alterarCampo}
              placeholder="Escreva a notícia completa aqui"
              required
            />
          </label>

          <div className="news-form-footer">
            <label className="news-form-check">
              <input
                name="ativo"
                type="checkbox"
                checked={formulario.ativo}
                onChange={alterarCampo}
              />
              Publicação ativa
            </label>

            <div className="news-form-actions">
              <Link className="news-form-button secondary" to={backPath}>
                Cancelar
              </Link>
              <button type="submit" className="news-form-button primary" disabled={salvando}>
                {salvando ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>

          {erro && <p className="news-form-error">{erro}</p>}
        </form>
      </div>
    </section>
  );
}

export default NewsForm;
