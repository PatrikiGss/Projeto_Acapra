import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { useAdminAccess } from "../../hooks/useAdminAccess";
import "./NewsComposer.css";

function NewsComposer({ categoria, categoriaLabel, backPath }) {
  const navigate = useNavigate();
  const { podeEditar } = useAdminAccess(categoria);
  const [titulo, setTitulo] = useState("");
  const [texto, setTexto] = useState("");
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    return () => {
      if (fotoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(fotoPreview);
      }
    };
  }, [fotoPreview]);

  const limparPreview = () => {
    if (fotoPreview.startsWith("blob:")) {
      URL.revokeObjectURL(fotoPreview);
    }
    setFotoPreview("");
  };

  const lidarComFoto = (file) => {
    limparPreview();
    setFotoFile(file || null);
    setFotoPreview(file ? URL.createObjectURL(file) : "");
  };

  const extrairMensagemErro = (errorResponse) => {
    const data = errorResponse.response?.data;
    if (!data) return "Não foi possível salvar a publicação.";
    if (typeof data === "string") return data;
    if (typeof data === "object") {
      const mensagens = Object.values(data).flat().filter(Boolean);
      if (mensagens.length > 0) return mensagens.join(" ");
    }
    return "Não foi possível salvar a publicação.";
  };

  const enviarFormulario = async (event) => {
    event.preventDefault();
    setSalvando(true);
    setErro("");

    const payload = new FormData();
    payload.append("categoria", categoria);
    payload.append("titulo", titulo);
    payload.append("texto", texto);
    payload.append("ativo", "true");

    if (fotoFile) {
      payload.append("foto", fotoFile);
    }

    try {
      const response = await api.post("/api/noticias/publicacoes/", payload);
      const id = response.data?.id;

      if (id) {
        navigate(`/${categoria}/${id}`);
      } else {
        navigate(backPath);
      }
    } catch (error) {
      setErro(extrairMensagemErro(error));
    } finally {
      setSalvando(false);
    }
  };

  if (!podeEditar) {
    return (
      <section className="news-composer-page">
        <div className="news-composer-shell">
          <div className="news-composer-message">
            Você não possui permissão para criar publicações nesta seção.
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="news-composer-page">
      <div className="news-composer-shell">
        <button type="button" className="news-composer-back" onClick={() => navigate(backPath)}>
          Voltar para {categoriaLabel}
        </button>

        <article className="news-composer-article">
          <form className="news-composer-form" onSubmit={enviarFormulario}>
            <div className="news-composer-meta">
              <span>{categoriaLabel}</span>
              <span>Nova publicação</span>
            </div>

            <label className="news-composer-title">
              <span>Título</span>
              <input
                value={titulo}
                onChange={(event) => setTitulo(event.target.value)}
                placeholder="Digite o título da matéria"
                required
              />
            </label>

            <label className="news-composer-image">
              <span>Foto</span>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => lidarComFoto(event.target.files?.[0] || null)}
                required
              />
            </label>

            {(fotoPreview || fotoFile) && (
              <div className="news-composer-preview">
                <img src={fotoPreview} alt="Pré-visualização da foto" />
              </div>
            )}

            <label className="news-composer-text">
              <span>Texto</span>
              <textarea
                value={texto}
                onChange={(event) => setTexto(event.target.value)}
                placeholder="Escreva a matéria completa"
                rows="12"
                required
              />
            </label>

            {erro && <p className="news-composer-error">{erro}</p>}

            <div className="news-composer-actions">
              <button type="button" className="news-composer-button secondary" onClick={() => navigate(backPath)}>
                Cancelar
              </button>
              <button type="submit" className="news-composer-button primary" disabled={salvando}>
                {salvando ? "Publicando..." : "Publicar"}
              </button>
            </div>
          </form>
        </article>
      </div>
    </section>
  );
}

export default NewsComposer;
