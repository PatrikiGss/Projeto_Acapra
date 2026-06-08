import { useEffect, useRef, useState } from "react";
import api from "../../services/api";
import { useAdminAccess } from "../../hooks/useAdminAccess";
import { formatBrazilianPhone, toBrazilianPhoneE164 } from "../../utils/phone";
import ConfirmModal from "../../components/ui/ConfirmModal";
import "./Denuncias.css";

const GRAVIDADE_OPCOES = [
  { value: "baixo", label: "Baixo" },
  { value: "medio", label: "Médio" },
  { value: "alta", label: "Alta" },
  { value: "urgente", label: "Urgente" },
];

const STATUS_OPCOES = [
  { value: "pendente", label: "Pendente" },
  { value: "em_analise", label: "Em análise" },
  { value: "resolvida", label: "Resolvida" },
];

const GRAVIDADE_COR = {
  baixo: "gravidade-baixo",
  medio: "gravidade-medio",
  alta: "gravidade-alta",
  urgente: "gravidade-urgente",
};

const initialForm = {
  titulo: "",
  descricao: "",
  gravidade: "",
  nome: "",
  telefone: "",
  foto: null,
};

function formatarData(valor) {
  if (!valor) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(valor));
}

function Denuncias() {
  const { podeEditar } = useAdminAccess("denuncias");
  const fotoInputRef = useRef(null);

  const [form, setForm] = useState(initialForm);
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState("");
  const [erro, setErro] = useState("");

  const [denuncias, setDenuncias] = useState([]);
  const [loadingLista, setLoadingLista] = useState(false);
  const [erroLista, setErroLista] = useState("");
  const [erroAcao, setErroAcao] = useState("");
  const [confirmacao, setConfirmacao] = useState(null);

  const carregarDenuncias = () => {
    if (!podeEditar) return;
    setLoadingLista(true);
    setErroLista("");
    api
      .get("/api/denuncias/denuncias/")
      .then((res) => setDenuncias(res.data || []))
      .catch(() => setErroLista("Não foi possível carregar as denúncias."))
      .finally(() => setLoadingLista(false));
  };

  useEffect(() => {
    carregarDenuncias();
  }, [podeEditar]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "foto") {
      setForm((f) => ({ ...f, foto: files[0] || null }));
    } else if (name === "telefone") {
      setForm((f) => ({ ...f, telefone: formatBrazilianPhone(value) }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setEnviando(true);
    setSucesso("");
    setErro("");

    const payload = new FormData();
    payload.append("titulo", form.titulo);
    payload.append("descricao", form.descricao);
    payload.append("gravidade", form.gravidade);
    if (form.telefone) payload.append("telefone", toBrazilianPhoneE164(form.telefone));
    if (form.nome) payload.append("nome", form.nome);
    if (form.foto) payload.append("foto", form.foto);

    api
      .post("/api/denuncias/denuncias/", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((res) => {
        setSucesso(res.data.detail || "Denúncia enviada com sucesso.");
        setForm(initialForm);
        if (fotoInputRef.current) fotoInputRef.current.value = "";
        carregarDenuncias();
      })
      .catch((err) => {
        const data = err.response?.data;
        const msg =
          data?.detail ||
          data?.telefone?.[0] ||
          "Não foi possível enviar a denúncia. Verifique os dados e tente novamente.";
        setErro(msg);
      })
      .finally(() => setEnviando(false));
  };

  const atualizarStatus = (id, novoStatus) => {
    api
      .patch(`/api/denuncias/denuncias/${id}/`, { status: novoStatus })
      .then((res) => {
        setDenuncias((lista) =>
          lista.map((d) => (d.id === id ? { ...d, ...res.data } : d))
        );
      })
      .catch(() => setErroAcao("Não foi possível atualizar o status."));
  };

  const excluirDenuncia = (denuncia) => {
    setConfirmacao(denuncia);
  };

  const confirmarExclusao = () => {
    if (!confirmacao) return;
    api
      .delete(`/api/denuncias/denuncias/${confirmacao.id}/`)
      .then(() => {
        setDenuncias((lista) => lista.filter((d) => d.id !== confirmacao.id));
        setConfirmacao(null);
      })
      .catch(() => {
        setErroAcao("Não foi possível remover a denúncia.");
        setConfirmacao(null);
      });
  };

  return (
    <div className="denuncias-page">
      <section className="denuncias-content">
        <div className="denuncias-heading">
          <h1>Denúncias</h1>
          <p>
            {podeEditar
              ? "Todas as denúncias enviadas pelos usuários da plataforma."
              : "Encontrou um animal em situação de risco ou maus-tratos? Relate aqui — sua denúncia é confidencial e nos ajuda a agir rapidamente."}
          </p>
        </div>

        {!podeEditar && <form className="denuncias-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="den-titulo">Título <span className="campo-obrigatorio">*</span></label>
            <input
              id="den-titulo"
              name="titulo"
              type="text"
              value={form.titulo}
              onChange={handleChange}
              required
              maxLength="100"
              placeholder="Ex: Animal abandonado na Rua XV"
            />
          </div>

          <div className="form-field">
            <label htmlFor="den-gravidade">Gravidade <span className="campo-obrigatorio">*</span></label>
            <select
              id="den-gravidade"
              name="gravidade"
              value={form.gravidade}
              onChange={handleChange}
              required
            >
              <option value="" disabled>
                Selecione a gravidade
              </option>
              {GRAVIDADE_OPCOES.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="den-descricao">Descrição <span className="campo-obrigatorio">*</span></label>
            <textarea
              id="den-descricao"
              name="descricao"
              value={form.descricao}
              onChange={handleChange}
              required
              minLength="20"
              rows="5"
              placeholder="Descreva a situação com o máximo de detalhes possível (local, horário, estado do animal...)"
            />
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="den-nome">Seu nome</label>
              <input
                id="den-nome"
                name="nome"
                type="text"
                value={form.nome}
                onChange={handleChange}
                maxLength="100"
                placeholder="Opcional"
              />
            </div>

            <div className="form-field">
              <label htmlFor="den-telefone">Telefone</label>
              <input
                id="den-telefone"
                name="telefone"
                type="tel"
                value={form.telefone}
                onChange={handleChange}
                inputMode="tel"
                autoComplete="tel-national"
                placeholder="(49) 99999-9999 — opcional"
                maxLength="15"
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="den-foto">Foto da ocorrência</label>
            <input
              ref={fotoInputRef}
              id="den-foto"
              name="foto"
              type="file"
              accept="image/*"
              onChange={handleChange}
            />
          </div>

          {sucesso && <p className="form-message success">{sucesso}</p>}
          {erro && <p className="form-message error">{erro}</p>}

          <button type="submit" disabled={enviando}>
            {enviando ? "Enviando..." : "Enviar denúncia"}
          </button>
        </form>}

        {podeEditar && (
          <section className="denuncias-admin">
            <div className="denuncias-admin-header">
              <h2>Denúncias recebidas</h2>
              <p>Todas as denúncias enviadas pelos usuários.</p>
            </div>

            {loadingLista && (
              <p className="denuncias-admin-message">Carregando...</p>
            )}

            {!loadingLista && erroLista && (
              <p className="denuncias-admin-message error">{erroLista}</p>
            )}

            {!loadingLista && !erroLista && denuncias.length === 0 && (
              <p className="denuncias-admin-message">
                Nenhuma denúncia recebida até o momento.
              </p>
            )}

            {!loadingLista && !erroLista && denuncias.length > 0 && (
              <div className="denuncias-admin-list">
                {denuncias.map((d) => (
                  <article className="denuncia-card" key={d.id}>
                    <div className="denuncia-card-header">
                      <div className="denuncia-card-title-row">
                        <h3>{d.titulo}</h3>
                        <span
                          className={`gravidade-badge ${GRAVIDADE_COR[d.gravidade] || ""}`}
                        >
                          {d.gravidade_display}
                        </span>
                      </div>
                      <div className="denuncia-card-actions">
                        <select
                          value={d.status}
                          onChange={(e) => atualizarStatus(d.id, e.target.value)}
                          className="status-select"
                        >
                          {STATUS_OPCOES.map((op) => (
                            <option key={op.value} value={op.value}>
                              {op.label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="denuncia-delete-button"
                          onClick={() => excluirDenuncia(d)}
                        >
                          Remover
                        </button>
                      </div>
                    </div>

                    <dl className="denuncia-card-details">
                      {d.nome && (
                        <div>
                          <dt>Nome</dt>
                          <dd>{d.nome}</dd>
                        </div>
                      )}
                      <div>
                        <dt>Telefone</dt>
                        <dd>{d.telefone}</dd>
                      </div>
                      <div>
                        <dt>Status</dt>
                        <dd>{d.status_display}</dd>
                      </div>
                      <div>
                        <dt>Recebida em</dt>
                        <dd>{formatarData(d.created_at)}</dd>
                      </div>
                    </dl>

                    <div className="denuncia-card-descricao">
                      <span>Descrição</span>
                      <p>{d.descricao}</p>
                    </div>

                    {d.foto && (
                      <div className="denuncia-card-foto">
                        <span>Foto</span>
                        <a href={d.foto} target="_blank" rel="noopener noreferrer">
                          <img src={d.foto} alt="Foto da denúncia" />
                        </a>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </section>

      {erroAcao && <p style={{ color: "#8a1f1f", padding: "0 1.5rem 1rem", fontSize: "0.9rem" }}>{erroAcao}</p>}

      <ConfirmModal
        open={Boolean(confirmacao)}
        title="Remover denúncia"
        message={`Tem certeza que deseja remover a denúncia "${confirmacao?.titulo || ""}"?`}
        confirmLabel="Remover"
        onConfirm={confirmarExclusao}
        onClose={() => setConfirmacao(null)}
      />
    </div>
  );
}

export default Denuncias;
