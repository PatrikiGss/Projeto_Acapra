import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api, { getMediaURL } from "../../services/api";
import { useAdminAccess } from "../../hooks/useAdminAccess";
import LoadingSpinner from "../ui/LoadingSpinner";
import { getApiErrorMessage } from "../../utils/errorUtils";
import { logError } from "../../utils/logger";
import { validateImageFile, IMAGE_ACCEPT } from "../../utils/upload";
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
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState("");
  const [fotosAdicionais, setFotosAdicionais] = useState([]);

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

  useEffect(() => {
    return () => {
      if (fotoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(fotoPreview);
      }
    };
  }, [fotoPreview]);

  useEffect(() => {
    return () => {
      fotosAdicionais.forEach((foto) => {
        if (foto.preview.startsWith("blob:")) {
          URL.revokeObjectURL(foto.preview);
        }
      });
    };
  }, [fotosAdicionais]);

  // Quantas fotos adicionais ainda cabem (a principal é obrigatória).
  const fotosExistentes = item?.fotos?.length || (item?.foto ? 1 : 0);
  const maxAdicionais =
    mode === "edit"
      ? Math.max(0, LIMITE_FOTOS - fotosExistentes)
      : LIMITE_FOTOS - 1;

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
    if (file) {
      const erroValidacao = validateImageFile(file);
      if (erroValidacao) {
        setErro(erroValidacao);
        return;
      }
    }
    setErro("");
    limparPreview();
    setFotoFile(file || null);
    setFotoPreview(file ? URL.createObjectURL(file) : "");
  };

  const lidarComFotosAdicionais = (fileList) => {
    const lista = Array.from(fileList || []);
    if (!lista.length) return;

    for (const file of lista) {
      const erroValidacao = validateImageFile(file);
      if (erroValidacao) {
        setErro(erroValidacao);
        return;
      }
    }

    fotosAdicionais.forEach((foto) => {
      if (foto.preview.startsWith("blob:")) {
        URL.revokeObjectURL(foto.preview);
      }
    });

    if (lista.length > maxAdicionais) {
      setErro(`Máximo de ${LIMITE_FOTOS} fotos no total (1 principal + ${maxAdicionais} adicionais).`);
    } else {
      setErro("");
    }

    setFotosAdicionais(
      lista.slice(0, maxAdicionais).map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      })),
    );
  };

  const extrairMensagemErro = (errorResponse) => {
    return getApiErrorMessage(errorResponse, "Não foi possível salvar a publicação.");
  };

  const enviarFormulario = async (event) => {
    event.preventDefault();
    setErro("");

    if (mode === "create" && !fotoFile && !item?.foto) {
      setErro("Adicione uma foto para a publicação.");
      return;
    }

    setSalvando(true);

    const payload = new FormData();
    payload.append("categoria", categoria);
    payload.append("titulo", formulario.titulo);
    payload.append("resumo", formulario.resumo);
    payload.append("texto", formulario.texto);
    payload.append("ativo", formulario.ativo ? "true" : "false");

    if (fotoFile) {
      payload.append("foto", fotoFile);
    }

    fotosAdicionais.forEach((foto) => {
      payload.append("fotos", foto.file);
    });

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
              accept={IMAGE_ACCEPT}
              onChange={(event) => lidarComFoto(event.target.files?.[0] || null)}
            />
          </label>

          <div className="news-form-extra">
            <div className="news-form-extra-head">
              <span>Fotos adicionais</span>
              <small>Até {LIMITE_FOTOS} fotos no total (1 principal + {maxAdicionais} adicionais)</small>
            </div>
            <input
              type="file"
              accept={IMAGE_ACCEPT}
              multiple
              disabled={maxAdicionais === 0}
              onChange={(event) => lidarComFotosAdicionais(event.target.files)}
            />
            {fotosAdicionais.length > 0 && (
              <div className="news-form-extra-grid">
                {fotosAdicionais.map((foto) => (
                  <div className="news-form-extra-item" key={foto.preview}>
                    <img src={foto.preview} alt="Pré-visualização de foto adicional" />
                  </div>
                ))}
              </div>
            )}
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
