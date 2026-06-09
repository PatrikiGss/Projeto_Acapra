import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../services/api";
import "./MetaConfig.css";

function MetaConfig() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const state = searchParams.get("state");
  const erro = searchParams.get("erro");

  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState(null);
  const [loading, setLoading] = useState(!erro);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(
    erro ? "Autorização cancelada ou falhou. Tente novamente." : "",
  );
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!state || erro) {
      setLoading(false);
      return;
    }

    const fetchPages = async () => {
      try {
        const response = await api.get(`/api/meta/pages/?state=${state}`);
        setPages(response.data.pages);
      } catch (err) {
        setError(
          err.response?.data?.detail ||
            "Não foi possível carregar as páginas.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPages();
  }, [state, erro]);

  const handleSave = async () => {
    if (!selectedPage) return;

    setSaving(true);
    setError("");

    try {
      const response = await api.post("/api/meta/save/", {
        state,
        page_id: selectedPage.id,
        page_name: selectedPage.name,
      });

      const msg = response.data.instagram_connected
        ? `Conectado! Página "${selectedPage.name}" e Instagram vinculados.`
        : `Conectado! Página "${selectedPage.name}" vinculada. (Instagram não encontrado)`;

      setSuccess(msg);
      setTimeout(() => navigate("/dashboard"), 2500);
    } catch (err) {
      setError(
        err.response?.data?.detail || "Não foi possível salvar a conexão.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="meta-config-page">
        <div className="meta-config-container">
          <p className="meta-config-loading">Carregando páginas do Facebook...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="meta-config-page">
      <div className="meta-config-container">
        <h1>Conectar ao Facebook</h1>

        {error && <p className="meta-config-error">{error}</p>}
        {success && <p className="meta-config-success">{success}</p>}

        {!success && !error && pages.length === 0 && (
          <p className="meta-config-empty">
            Nenhuma página encontrada. Certifique-se de que você é
            administrador de uma página no Facebook.
          </p>
        )}

        {!success && pages.length > 0 && (
          <>
            <p className="meta-config-subtitle">
              Selecione a página que receberá as publicações automáticas:
            </p>

            <ul className="meta-config-pages">
              {pages.map((page) => (
                <li key={page.id}>
                  <label
                    className={`meta-config-page-option ${
                      selectedPage?.id === page.id ? "selected" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="page"
                      value={page.id}
                      checked={selectedPage?.id === page.id}
                      onChange={() => setSelectedPage(page)}
                    />
                    {page.name}
                  </label>
                </li>
              ))}
            </ul>

            <button
              className="meta-config-btn"
              onClick={handleSave}
              disabled={!selectedPage || saving}
            >
              {saving ? "Salvando..." : "Salvar conexão"}
            </button>
          </>
        )}

        {!success && (
          <button
            className="meta-config-btn meta-config-btn--secondary"
            onClick={() => navigate("/dashboard")}
          >
            Voltar ao painel
          </button>
        )}
      </div>
    </section>
  );
}

export default MetaConfig;
