import { useCallback, useEffect, useState } from "react";
import api from "../../services/api";
import { useAdminAccess } from "../../hooks/useAdminAccess";
import { formatBrazilianPhone, toBrazilianPhoneE164 } from "../../utils/phone";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import EmptyState from "../../components/ui/EmptyState";
import ConfirmModal from "../../components/ui/ConfirmModal";
import { getResponseItems } from "../../utils/collection";
import { excluirRecurso } from "../../utils/crud";
import { carimboDeData, exportarCsv } from "../../utils/csv";
import "../VoluntariadoView/Voluntariado.css";
import "./Castracao.css";

const TIPO_ANIMAL_OPCOES = [
  { value: "cachorro", label: "Cachorro" },
  { value: "gato", label: "Gato" },
  { value: "outros", label: "Outros" },
];

const SEXO_OPCOES = [
  { value: "macho", label: "Macho" },
  { value: "femea", label: "Fêmea" },
];

const STATUS_OPCOES = [
  { value: "pendente", label: "Pendente" },
  { value: "agendada", label: "Agendada" },
  { value: "realizada", label: "Realizada" },
];

const STATUS_COR = {
  pendente: "status-pendente",
  agendada: "status-agendada",
  realizada: "status-realizada",
};

const initialForm = {
  nome: "",
  telefone: "",
  email: "",
  tipo_animal: "",
  sexo: "",
  observacoes: "",
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

// No CSV a data vai só com números para o Excel reconhecer como data.
function formatarDataCsv(valor) {
  if (!valor) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(valor));
}

const COLUNAS_CSV = [
  { label: "Nome", valor: (p) => p.nome },
  { label: "Telefone", valor: (p) => formatBrazilianPhone(p.telefone || "") },
  { label: "E-mail", valor: (p) => p.email },
  { label: "Tipo do animal", valor: (p) => p.tipo_animal_display },
  { label: "Sexo do animal", valor: (p) => p.sexo_display },
  { label: "Andamento", valor: (p) => p.status_display },
  { label: "Observações", valor: (p) => p.observacoes },
  { label: "Data do pedido", valor: (p) => formatarDataCsv(p.created_at) },
];

function Castracao() {
  const { podeEditar } = useAdminAccess("castracao");

  const [form, setForm] = useState(initialForm);
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState("");
  const [erro, setErro] = useState("");

  const [pedidos, setPedidos] = useState([]);
  // Começa carregando: a lista só é montada quando `podeEditar` fica true, e o
  // carregamento inicial acontece no efeito abaixo.
  const [loadingLista, setLoadingLista] = useState(true);
  const [erroLista, setErroLista] = useState("");
  const [erroAcao, setErroAcao] = useState("");
  const [pedidoParaExclusao, setPedidoParaExclusao] = useState(null);

  const carregarPedidos = useCallback(({ silencioso = false } = {}) => {
    if (!podeEditar) return;
    if (!silencioso) setLoadingLista(true);
    setErroLista("");
    api.get("/api/castracao/castracoes/")
      .then((res) => setPedidos(getResponseItems(res.data)))
      .catch(() => setErroLista("Não foi possível carregar os pedidos de castração."))
      .finally(() => {
        if (!silencioso) setLoadingLista(false);
      });
  }, [podeEditar]);

  useEffect(() => {
    if (!podeEditar) return undefined;

    let ativo = true;

    const carregar = async () => {
      try {
        const res = await api.get("/api/castracao/castracoes/");
        if (ativo) {
          setPedidos(getResponseItems(res.data));
          setErroLista("");
        }
      } catch {
        if (ativo) setErroLista("Não foi possível carregar os pedidos de castração.");
      } finally {
        if (ativo) setLoadingLista(false);
      }
    };

    void carregar();
    return () => { ativo = false; };
  }, [podeEditar]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((atual) => ({
      ...atual,
      [name]: name === "telefone" ? formatBrazilianPhone(value) : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setEnviando(true);
    setSucesso("");
    setErro("");

    const payload = {
      ...form,
      telefone: toBrazilianPhoneE164(form.telefone),
      email: form.email || null,
    };

    api.post("/api/castracao/castracoes/", payload)
      .then((res) => {
        setSucesso(res.data.detail || "Pedido de castração enviado com sucesso.");
        setForm(initialForm);
        carregarPedidos();
      })
      .catch((err) => {
        const dados = err.response?.data;
        setErro(
          dados?.detail ||
          dados?.telefone?.[0] ||
          dados?.nome?.[0] ||
          "Não foi possível enviar o pedido. Confira os dados e tente novamente."
        );
      })
      .finally(() => setEnviando(false));
  };

  const atualizarStatus = (id, novoStatus) => {
    setErroAcao("");
    api.patch(`/api/castracao/castracoes/${id}/`, { status: novoStatus })
      .then(() => carregarPedidos({ silencioso: true }))
      .catch(() => setErroAcao("Não foi possível atualizar o andamento."));
  };

  const exportarPedidos = () => {
    exportarCsv(`pedidos-castracao-${carimboDeData()}.csv`, COLUNAS_CSV, pedidos);
  };

  const confirmarExclusao = async () => {
    if (!pedidoParaExclusao) return;
    setErroAcao("");
    await excluirRecurso(`/api/castracao/castracoes/${pedidoParaExclusao.id}/`, {
      aoRemover: () => setPedidos((lista) => lista.filter((p) => p.id !== pedidoParaExclusao.id)),
      recarregar: () => carregarPedidos({ silencioso: true }),
      aoErro: setErroAcao,
      mensagemErro: "Não foi possível remover o pedido.",
    });
    setPedidoParaExclusao(null);
  };

  return (
    <div className="voluntariado-page">
      <section className="voluntariado-content">
        <div className="voluntariado-heading">
          <h1>Castração de animais</h1>
          <p>
            Precisa castrar seu animal? Informe os dados abaixo que a ACAPRA entra
            em contato para orientar sobre as próximas castrações.
          </p>
        </div>

        {!podeEditar && (
          <div className="voluntariado-layout">
            <form className="voluntariado-form" onSubmit={handleSubmit}>
            <label>
              Nome da pessoa responsável
              <input
                name="nome"
                type="text"
                value={form.nome}
                onChange={handleChange}
                required
                minLength="3"
                maxLength="200"
              />
            </label>

            <div className="form-row">
              <label>
                Telefone para contato
                <input
                  name="telefone"
                  type="tel"
                  value={form.telefone}
                  onChange={handleChange}
                  required
                  inputMode="tel"
                  autoComplete="tel-national"
                  placeholder="(49) 99999-9999"
                  maxLength="15"
                />
              </label>

              <label>
                Sexo do animal
                <select
                  name="sexo"
                  value={form.sexo}
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled>Selecione</option>
                  {SEXO_OPCOES.map((op) => (
                    <option key={op.value} value={op.value}>{op.label}</option>
                  ))}
                </select>
              </label>
            </div>

            <label>
              Tipo do animal
              <select
                name="tipo_animal"
                value={form.tipo_animal}
                onChange={handleChange}
                required
              >
                <option value="" disabled>Selecione o tipo</option>
                {TIPO_ANIMAL_OPCOES.map((op) => (
                  <option key={op.value} value={op.value}>{op.label}</option>
                ))}
              </select>
            </label>

            <label>
              E-mail
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Opcional"
              />
            </label>

            <label>
              Observações
              <textarea
                name="observacoes"
                value={form.observacoes}
                onChange={handleChange}
                rows="4"
                placeholder="Opcional — porte, idade, raça, condições de saúde do animal..."
              />
            </label>

            {sucesso && <p className="form-message success">{sucesso}</p>}
            {erro && <p className="form-message error">{erro}</p>}

            <button type="submit" disabled={enviando}>
              {enviando ? "Enviando..." : "Enviar pedido"}
            </button>
            </form>
          </div>
        )}

        {podeEditar && (
          <section className="voluntariado-admin">
            <div className="voluntariado-admin-header">
              <div className="castracao-admin-title-row">
                <h2>Pedidos de castração</h2>
                <button
                  type="button"
                  className="castracao-export-button"
                  onClick={exportarPedidos}
                  disabled={loadingLista || pedidos.length === 0}
                  title="Baixa a lista completa em CSV para abrir no Excel"
                >
                  Exportar CSV
                </button>
              </div>
              <p>Lista de pedidos enviados pelo site. Visível apenas para administradores.</p>
            </div>

            {loadingLista && <LoadingSpinner label="Carregando pedidos..." />}

            {!loadingLista && erroLista && (
              <EmptyState title="Não foi possível carregar os pedidos." description={erroLista} />
            )}

            {!loadingLista && !erroLista && pedidos.length === 0 && (
              <EmptyState
                title="Nenhum pedido de castração até o momento."
                description="Os pedidos enviados pelo formulário aparecerão aqui."
              />
            )}

            {!loadingLista && !erroLista && pedidos.length > 0 && (
              <div className="voluntariado-admin-list">
                {pedidos.map((pedido) => (
                  <article className="voluntariado-card" key={pedido.id}>
                    <div className="voluntariado-card-header">
                      <div>
                        <div className="castracao-card-title-row">
                          <h3>{pedido.nome}</h3>
                          <span className={`castracao-status-badge ${STATUS_COR[pedido.status] || ""}`}>
                            {pedido.status_display}
                          </span>
                        </div>
                        <p>{formatarData(pedido.created_at)}</p>
                      </div>
                      <div className="castracao-card-actions">
                        <select
                          className="status-select"
                          value={pedido.status}
                          onChange={(e) => atualizarStatus(pedido.id, e.target.value)}
                          aria-label={`Andamento do pedido de ${pedido.nome}`}
                        >
                          {STATUS_OPCOES.map((op) => (
                            <option key={op.value} value={op.value}>{op.label}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="voluntariado-delete-button"
                          onClick={() => setPedidoParaExclusao(pedido)}
                        >
                          Remover
                        </button>
                      </div>
                    </div>

                    <dl className="voluntariado-card-details">
                      <div><dt>Telefone</dt><dd>{pedido.telefone}</dd></div>
                      <div><dt>Tipo do animal</dt><dd>{pedido.tipo_animal_display}</dd></div>
                      <div><dt>Sexo do animal</dt><dd>{pedido.sexo_display}</dd></div>
                      {pedido.email && (
                        <div><dt>E-mail</dt><dd>{pedido.email}</dd></div>
                      )}
                    </dl>

                    {pedido.observacoes && (
                      <div className="voluntariado-card-motivo">
                        <span>Observações</span>
                        <p>{pedido.observacoes}</p>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}

            {erroAcao && (
              <p className="voluntariado-admin-message error">{erroAcao}</p>
            )}

            <ConfirmModal
              open={Boolean(pedidoParaExclusao)}
              title="Remover pedido"
              message={`Tem certeza que deseja remover o pedido de "${pedidoParaExclusao?.nome || ""}"?`}
              confirmLabel="Remover"
              onClose={() => setPedidoParaExclusao(null)}
              onConfirm={confirmarExclusao}
            />
          </section>
        )}
      </section>
    </div>
  );
}

export default Castracao;
