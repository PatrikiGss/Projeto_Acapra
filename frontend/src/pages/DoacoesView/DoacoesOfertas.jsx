import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { useAdminAccess } from "../../hooks/useAdminAccess";
import ConfirmModal from "../../components/ui/ConfirmModal";
import { getResponseItems } from "../../utils/collection";
import { excluirRecurso } from "../../utils/crud";
import { logError } from "../../utils/logger";
import { formatBrazilianPhone } from "../../utils/phone";
import "./DoacoesOfertas.css";

const STATUS_OPCOES = [
  { value: "pendente", label: "Pendente" },
  { value: "em_contato", label: "Em contato" },
  { value: "recebida", label: "Recebida" },
];

const STATUS_COR = {
  pendente: "status-pendente",
  em_contato: "status-em-contato",
  recebida: "status-recebida",
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

function linkWhatsApp(telefone) {
  if (!telefone) return null;
  const digits = String(telefone).replace(/\D/g, "");
  if (!digits) return null;
  const normalized = digits.startsWith("55") && digits.length >= 12 ? digits : `55${digits}`;
  return `https://wa.me/${normalized}`;
}

function DoacoesOfertas() {
  const { podeEditar } = useAdminAccess("doacoes");

  const [ofertas, setOfertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erroLista, setErroLista] = useState("");
  const [erroAcao, setErroAcao] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [confirmacao, setConfirmacao] = useState(null);

  const carregarOfertas = ({ silencioso = false } = {}) => {
    if (!podeEditar) {
      setLoading(false);
      return;
    }
    if (!silencioso) setLoading(true);
    setErroLista("");
    api
      .get("/api/doacoes/ofertas/")
      .then((res) => setOfertas(getResponseItems(res.data)))
      .catch((erro) => {
        logError("DoacoesOfertas", erro);
        setErroLista("Não foi possível carregar as doações recebidas.");
      })
      .finally(() => {
        if (!silencioso) setLoading(false);
      });
  };

  useEffect(() => {
    carregarOfertas();
  }, [podeEditar]);

  const ofertasFiltradas = useMemo(() => {
    if (filtroStatus === "todos") return ofertas;
    return ofertas.filter((o) => o.status === filtroStatus);
  }, [ofertas, filtroStatus]);

  const totaisPorStatus = useMemo(() => {
    return ofertas.reduce(
      (acc, o) => {
        acc.todos += 1;
        acc[o.status] = (acc[o.status] || 0) + 1;
        return acc;
      },
      { todos: 0, pendente: 0, em_contato: 0, recebida: 0 },
    );
  }, [ofertas]);

  const atualizarStatus = (id, novoStatus) => {
    setErroAcao("");
    api
      .patch(`/api/doacoes/ofertas/${id}/`, { status: novoStatus })
      .then(() => carregarOfertas({ silencioso: true }))
      .catch(() => setErroAcao("Não foi possível atualizar o status da doação."));
  };

  const confirmarExclusao = async () => {
    if (!confirmacao) return;
    setErroAcao("");
    await excluirRecurso(`/api/doacoes/ofertas/${confirmacao.id}/`, {
      aoRemover: () => setOfertas((lista) => lista.filter((o) => o.id !== confirmacao.id)),
      recarregar: () => carregarOfertas({ silencioso: true }),
      aoErro: setErroAcao,
      mensagemErro: "Não foi possível remover a doação.",
    });
    setConfirmacao(null);
  };

  if (!podeEditar) {
    return (
      <div className="doacoes-page">
        <section className="doacoes-content">
          <div className="doacoes-empty">
            <h1>Acesso restrito</h1>
            <p>Seu usuário não possui permissão para visualizar as doações recebidas.</p>
            <Link to="/" className="doacoes-link-button">Voltar ao início</Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="doacoes-page">
      <section className="doacoes-content">
        <div className="doacoes-heading">
          <h1>Doações recebidas</h1>
          <p>
            Ofertas de itens enviadas pelo público através do formulário “Quero doar algo” na
            página Apoie. Atualize o andamento do contato com cada doador.
          </p>
        </div>

        <div className="doacoes-toolbar" aria-label="Filtrar por status">
          <button
            type="button"
            className={filtroStatus === "todos" ? "active" : ""}
            onClick={() => setFiltroStatus("todos")}
          >
            Todas ({totaisPorStatus.todos})
          </button>
          {STATUS_OPCOES.map((op) => (
            <button
              key={op.value}
              type="button"
              className={filtroStatus === op.value ? "active" : ""}
              onClick={() => setFiltroStatus(op.value)}
            >
              {op.label} ({totaisPorStatus[op.value] || 0})
            </button>
          ))}
        </div>

        {loading && <p className="doacoes-message">Carregando...</p>}

        {!loading && erroLista && <p className="doacoes-message error">{erroLista}</p>}

        {!loading && !erroLista && ofertasFiltradas.length === 0 && (
          <p className="doacoes-message">
            {ofertas.length === 0
              ? "Nenhuma doação recebida até o momento."
              : "Nenhuma doação com este status."}
          </p>
        )}

        {!loading && !erroLista && ofertasFiltradas.length > 0 && (
          <div className="doacoes-list">
            {ofertasFiltradas.map((oferta) => {
              const whatsapp = linkWhatsApp(oferta.telefone);
              return (
                <article className="doacao-card" key={oferta.id}>
                  <div className="doacao-card-header">
                    <div className="doacao-card-title-row">
                      <h3>{oferta.item}</h3>
                      <span className={`status-badge ${STATUS_COR[oferta.status] || ""}`}>
                        {oferta.status_display}
                      </span>
                    </div>
                    <div className="doacao-card-actions">
                      <select
                        value={oferta.status}
                        onChange={(e) => atualizarStatus(oferta.id, e.target.value)}
                        className="status-select"
                        aria-label="Atualizar status da doação"
                      >
                        {STATUS_OPCOES.map((op) => (
                          <option key={op.value} value={op.value}>{op.label}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="doacao-delete-button"
                        onClick={() => setConfirmacao(oferta)}
                      >
                        Remover
                      </button>
                    </div>
                  </div>

                  <dl className="doacao-card-details">
                    <div><dt>Doador</dt><dd>{oferta.nome_doador}</dd></div>
                    <div>
                      <dt>Telefone</dt>
                      <dd>
                        {whatsapp ? (
                          <a href={whatsapp} target="_blank" rel="noopener noreferrer">
                            {formatBrazilianPhone(oferta.telefone) || oferta.telefone}
                          </a>
                        ) : (
                          oferta.telefone || "—"
                        )}
                      </dd>
                    </div>
                    <div><dt>Categoria</dt><dd>{oferta.categoria_display}</dd></div>
                    {oferta.quantidade && (
                      <div><dt>Quantidade</dt><dd>{oferta.quantidade}</dd></div>
                    )}
                    <div><dt>Recebida em</dt><dd>{formatarData(oferta.created_at)}</dd></div>
                  </dl>

                  {oferta.observacoes && (
                    <div className="doacao-card-obs">
                      <span>Observações</span>
                      <p>{oferta.observacoes}</p>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {erroAcao && <p className="doacoes-erro-acao">{erroAcao}</p>}
      </section>

      <ConfirmModal
        open={Boolean(confirmacao)}
        title="Remover doação"
        message={`Tem certeza que deseja remover a oferta de "${confirmacao?.nome_doador || ""}"?`}
        confirmLabel="Remover"
        onConfirm={confirmarExclusao}
        onClose={() => setConfirmacao(null)}
      />
    </div>
  );
}

export default DoacoesOfertas;
