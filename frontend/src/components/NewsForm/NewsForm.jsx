import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api, { getMediaURL } from "../../services/api";
import { useAdminAccess } from "../../hooks/useAdminAccess";
import "./NewsForm.css";

const categoriaLabels = {
  noticias: "Notícias",
  resgates: "Resgates",
  campanhas: "Campanhas",
};

const formVazio = {
  titulo: "",
  resumo: "",
  texto: "",
  ativo: true,
};

function NewsForm({ categoria, backPath, mode = "create", basePath }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const { podeEditar } = useAdminAccess(categoria);
  const rotaCategoria = basePath ? `${basePath}/${categoria}` : `/${categoria}`;
  const [loading, setLoading] = useState(mode === "edit");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [item, setItem] = useState(null);
  const [formulario, setFormulario] = useState(formVazio);
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState("");

  const categoriaLabel = useMemo(
    () => categoriaLabels[categoria] || "Publicação",
    [categoria]
  );

  useEffect(() => {
    let ignorado = false;

    if (mode !== "edit" || !id) {
      return () => {
        ignorado = true;
      };
    }

    Promise.resolve().then(async () => {
      if (ignorado) return;

      setLoading(true);

      try {
        const response = await api.get(`/api/noticias/publicacoes/${id}/`);
        if (ignorado) return;

        const data = response.data || null;
        setItem(data);
        setFormulario({
          titulo: data?.titulo || "",
          resumo: data?.resumo || "",
          texto: data?.texto || "",
          ativo: Boolean(data?.ativo ?? true),
        });
      } catch (error) {
        if (ignorado) return;
        console.error(error);
        setErro("Não foi possível carregar a publicação.");
      } finally {
        if (!ignorado) {
          setLoading(false);
        }
      }
    });

    return () => {
      ignorado = true;
    };
  }, [id, mode]);

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

  const alterarCampo = (event) => {
    const { name, value, type, checked } = event.target;
    const novoValor = type === "checkbox" ? checked : value;
    setFormulario((atual) => ({
      ...atual,
      [name]: novoValor,
    }));
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
    payload.append("titulo", formulario.titulo);
    payload.append("resumo", formulario.resumo);
    payload.append("texto", formulario.texto);
    payload.append("ativo", formulario.ativo ? "true" : "false");

    if (fotoFile) {
      payload.append("foto", fotoFile);
    }

    try {
      let response;

      if (mode === "edit" && item) {
        response = await api.patch(`/api/noticias/publicacoes/${item.id}/`, payload);
      } else {
        response = await api.post("/api/noticias/publicacoes/", payload);
      }

      navigate(`${rotaCategoria}/${response.data.id}`);
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
          <div className="news-form-message">Carregando publicação...</div>
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

          <label className="news-form-image-zone">
            {fotoPreview || item?.foto ? (
              <img
                src={fotoPreview || getMediaURL(item.foto)}
                alt="Pré-visualização da foto"
              />
            ) : (
              <div className="news-form-image-placeholder">
                Clique para adicionar a foto
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              onChange={(event) => lidarComFoto(event.target.files?.[0] || null)}
              required={mode === "create" && !item?.foto}
            />
          </label>

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
