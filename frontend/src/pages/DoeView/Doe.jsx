import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import { useAdminAccess } from "../../hooks/useAdminAccess";
import { formatBrazilianPhone, toBrazilianPhoneE164 } from "../../utils/phone";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import EmptyState from "../../components/ui/EmptyState";
import ConfirmModal from "../../components/ui/ConfirmModal";
import { getResponseItems } from "../../utils/collection";
import { getApiErrorMessage } from "../../utils/errorUtils";
import "./Doe.css";

const bankFields = [
  ["Banco", "banco"],
  ["Agência", "agencia"],
  ["Conta", "conta"],
  ["Tipo", "tipo_conta"],
  ["CNPJ", "cnpj"],
  ["Favorecido", "favorecido"],
];

const formVazio = {
  chave_pix: "",
  descricao: "",
  banco: "",
  agencia: "",
  conta: "",
  tipo_conta: "",
  cnpj: "",
  favorecido: "",
  ativo: true,
};

const itemFormVazio = {
  nome: "",
  telefone: "",
  email: "",
  descricao: "",
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

function Doe() {
  const [dadosList, setDadosList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { podeEditar } = useAdminAccess("doacoes");
  const [modalAberto, setModalAberto] = useState(false);
  const [modoFormulario, setModoFormulario] = useState("criar");
  const [dadosEditando, setDadosEditando] = useState(null);
  const [formulario, setFormulario] = useState(formVazio);
  const [qrCodeFile, setQrCodeFile] = useState(null);
  const [previewQrCode, setPreviewQrCode] = useState("");
  const [removerQrCode, setRemoverQrCode] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erroFormulario, setErroFormulario] = useState("");
  const [copiado, setCopiado] = useState(false);

  // --- Doação de itens ---
  const [itemForm, setItemForm] = useState(itemFormVazio);
  const [itemEnviando, setItemEnviando] = useState(false);
  const [itemSucesso, setItemSucesso] = useState("");
  const [itemErro, setItemErro] = useState("");

  const [itens, setItens] = useState([]);
  const [itensLoading, setItensLoading] = useState(false);
  const [itensErro, setItensErro] = useState("");
  const [itemParaExclusao, setItemParaExclusao] = useState(null);
  const [erroExclusao, setErroExclusao] = useState("");

  // --- Pix data ---
  useEffect(() => {
    let ativo = true;

    const carregar = async () => {
      setLoading(true);
      try {
        const response = await api.get("/api/doacoes/pix/");
        if (!ativo) return;
        setDadosList(getResponseItems(response.data));
        setError(false);
      } catch (erro) {
        if (!ativo) return;
        console.error(erro);
        setError(true);
      } finally {
        if (ativo) setLoading(false);
      }
    };

    void carregar();
    return () => { ativo = false; };
  }, []);

  // --- Carrega itens doados (apenas admin) ---
  const carregarItens = useCallback(() => {
    if (!podeEditar) return;
    setItensLoading(true);
    setItensErro("");
    api
      .get("/api/doacoes/itens/")
      .then((res) => setItens(res.data || []))
      .catch(() => setItensErro("Não foi possível carregar as doações de itens."))
      .finally(() => setItensLoading(false));
  }, [podeEditar]);

  useEffect(() => {
    carregarItens();
  }, [carregarItens]);

  // --- Blob cleanup ---
  useEffect(() => {
    return () => {
      if (previewQrCode.startsWith("blob:")) URL.revokeObjectURL(previewQrCode);
    };
  }, [previewQrCode]);

  useEffect(() => {
    if (!copiado) return undefined;
    const timer = window.setTimeout(() => setCopiado(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copiado]);

  const dadosDoacao = useMemo(() => dadosList[0] || null, [dadosList]);
  const hasBankData = dadosDoacao && bankFields.some(([, key]) => dadosDoacao[key]);
  const qrCodeAtual = dadosEditando?.qr_code || dadosDoacao?.qr_code || "";
  const modalVisivel = podeEditar && modalAberto;

  const atualizarLista = async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/doacoes/pix/");
      setDadosList(getResponseItems(response.data));
      setError(false);
    } catch (erro) {
      console.error(erro);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const limparPreview = () => {
    if (previewQrCode.startsWith("blob:")) URL.revokeObjectURL(previewQrCode);
    setPreviewQrCode("");
  };

  const abrirCriacao = () => {
    setModoFormulario("criar");
    setDadosEditando(null);
    setFormulario(formVazio);
    setQrCodeFile(null);
    setRemoverQrCode(false);
    setErroFormulario("");
    limparPreview();
    setModalAberto(true);
  };

  const abrirEdicao = () => {
    if (!dadosDoacao) return;
    setModoFormulario("editar");
    setDadosEditando(dadosDoacao);
    setFormulario({
      chave_pix: dadosDoacao.chave_pix || "",
      descricao: dadosDoacao.descricao || "",
      banco: dadosDoacao.banco || "",
      agencia: dadosDoacao.agencia || "",
      conta: dadosDoacao.conta || "",
      tipo_conta: dadosDoacao.tipo_conta || "",
      cnpj: dadosDoacao.cnpj || "",
      favorecido: dadosDoacao.favorecido || "",
      ativo: Boolean(dadosDoacao.ativo ?? true),
    });
    setQrCodeFile(null);
    setRemoverQrCode(false);
    setErroFormulario("");
    limparPreview();
    setModalAberto(true);
  };

  const fecharModal = () => {
    limparPreview();
    setModalAberto(false);
    setDadosEditando(null);
    setFormulario(formVazio);
    setQrCodeFile(null);
    setRemoverQrCode(false);
    setErroFormulario("");
    setSalvando(false);
  };

  const alterarCampo = (event) => {
    const { name, value, type, checked } = event.target;
    const novoValor =
      type === "checkbox" ? checked : name === "ativo" ? value === "true" : value;
    setFormulario((atual) => ({ ...atual, [name]: novoValor }));
  };

  const lidarComQrCode = (file) => {
    limparPreview();
    setQrCodeFile(file || null);
    setRemoverQrCode(false);
    setPreviewQrCode(file ? URL.createObjectURL(file) : "");
  };

  const alternarRemocaoQrCode = (checked) => {
    setRemoverQrCode(checked);
    if (checked) {
      setQrCodeFile(null);
      limparPreview();
    }
  };

  const copiarChavePix = async () => {
    if (!dadosDoacao?.chave_pix) return;
    try {
      await navigator.clipboard.writeText(dadosDoacao.chave_pix);
      setCopiado(true);
    } catch (err) {
      console.error(err);
    }
  };

  const enviarFormulario = async (event) => {
    event.preventDefault();
    setSalvando(true);
    setErroFormulario("");

    const payload = new FormData();
    payload.append("chave_pix", formulario.chave_pix);
    payload.append("descricao", formulario.descricao);
    payload.append("banco", formulario.banco);
    payload.append("agencia", formulario.agencia);
    payload.append("conta", formulario.conta);
    payload.append("tipo_conta", formulario.tipo_conta);
    payload.append("cnpj", formulario.cnpj);
    payload.append("favorecido", formulario.favorecido);
    payload.append("ativo", formulario.ativo ? "true" : "false");
    if (qrCodeFile) payload.append("qr_code", qrCodeFile);
    if (removerQrCode) payload.append("remover_qr_code", "true");

    try {
      if (modoFormulario === "editar" && dadosEditando) {
        await api.patch(`/api/doacoes/pix/${dadosEditando.id}/`, payload);
      } else {
        await api.post("/api/doacoes/pix/", payload);
      }
      await atualizarLista();
      fecharModal();
    } catch (errorResponse) {
      setErroFormulario(getApiErrorMessage(errorResponse, "Não foi possível salvar os dados de doação."));
    } finally {
      setSalvando(false);
    }
  };

  // --- Handlers de doação de itens ---
  const alterarItemCampo = (event) => {
    const { name, value } = event.target;
    setItemForm((atual) => ({
      ...atual,
      [name]: name === "telefone" ? formatBrazilianPhone(value) : value,
    }));
  };

  const enviarItemForm = (event) => {
    event.preventDefault();
    setItemEnviando(true);
    setItemSucesso("");
    setItemErro("");

    const payload = {
      nome: itemForm.nome,
      telefone: toBrazilianPhoneE164(itemForm.telefone),
      descricao: itemForm.descricao,
    };
    if (itemForm.email) payload.email = itemForm.email;

    api
      .post("/api/doacoes/itens/", payload)
      .then((res) => {
        setItemSucesso(res.data.detail || "Doação registrada com sucesso!");
        setItemForm(itemFormVazio);
        carregarItens();
      })
      .catch((err) => {
        const data = err.response?.data;
        const msg =
          data?.detail ||
          data?.telefone?.[0] ||
          data?.descricao?.[0] ||
          data?.nome?.[0] ||
          "Não foi possível registrar a doação. Verifique os dados e tente novamente.";
        setItemErro(msg);
      })
      .finally(() => setItemEnviando(false));
  };

  const confirmarExclusaoItem = () => {
    if (!itemParaExclusao) return;
    api
      .delete(`/api/doacoes/itens/${itemParaExclusao.id}/`)
      .then(() => {
        setItens((lista) => lista.filter((i) => i.id !== itemParaExclusao.id));
        setItemParaExclusao(null);
      })
      .catch(() => {
        setErroExclusao(getApiErrorMessage(null, "Não foi possível remover a doação."));
        setItemParaExclusao(null);
      });
  };

  const hasCurrentQr = Boolean(qrCodeAtual) && !removerQrCode;
  const currentPreview = previewQrCode || (hasCurrentQr ? qrCodeAtual : "");

  return (
    <div className="doe-page">
      <section className="doe-header">
        <h1>Ajude a ACAPRA</h1>
        <p>
          {dadosDoacao?.descricao || "Use o PIX ou os dados bancários para fazer a sua doação."}
        </p>

        {podeEditar && (
          <button
            type="button"
            className="doe-admin-button"
            onClick={dadosDoacao ? abrirEdicao : abrirCriacao}
          >
            {dadosDoacao ? "Editar dados de doação" : "Cadastrar dados de doação"}
          </button>
        )}
      </section>

      {loading && <LoadingSpinner label="Carregando dados de doação..." />}

      {!loading && error && (
        <EmptyState
          title="Não foi possível carregar os dados de doação."
          description="Tente novamente em instantes."
        />
      )}

      {!loading && !error && !dadosDoacao && (
        <EmptyState
          title="Nenhum dado de doação ativo foi cadastrado."
          description="Cadastre os dados pelo painel administrativo."
        />
      )}

      {!loading && !error && dadosDoacao && (
        <section className="donation-grid" aria-label="Dados para doação">
          <article className="donation-card pix-card">
            <div>
              <span className="card-label">PIX</span>
              <h2>QR Code</h2>
            </div>

            <div className="qr-code-image">
              {dadosDoacao.qr_code ? (
                <img src={dadosDoacao.qr_code} alt="QR Code PIX da ACAPRA" />
              ) : (
                <div className="qr-placeholder" aria-label="QR Code não cadastrado">
                  <svg viewBox="0 0 64 64" width="96" height="96" fill="none" aria-hidden="true">
                    <rect x="4" y="4" width="24" height="24" rx="2" stroke="currentColor" strokeWidth="3" fill="none"/>
                    <rect x="10" y="10" width="12" height="12" rx="1" fill="currentColor"/>
                    <rect x="36" y="4" width="24" height="24" rx="2" stroke="currentColor" strokeWidth="3" fill="none"/>
                    <rect x="42" y="10" width="12" height="12" rx="1" fill="currentColor"/>
                    <rect x="4" y="36" width="24" height="24" rx="2" stroke="currentColor" strokeWidth="3" fill="none"/>
                    <rect x="10" y="42" width="12" height="12" rx="1" fill="currentColor"/>
                    <rect x="36" y="36" width="6" height="6" fill="currentColor"/>
                    <rect x="46" y="36" width="6" height="6" fill="currentColor"/>
                    <rect x="56" y="36" width="4" height="6" fill="currentColor"/>
                    <rect x="36" y="46" width="6" height="6" fill="currentColor"/>
                    <rect x="46" y="46" width="14" height="6" fill="currentColor"/>
                    <rect x="36" y="56" width="6" height="4" fill="currentColor"/>
                    <rect x="46" y="56" width="6" height="4" fill="currentColor"/>
                    <rect x="56" y="52" width="4" height="8" fill="currentColor"/>
                  </svg>
                  <span>QR Code não cadastrado</span>
                </div>
              )}
            </div>

            <div className="pix-key-box">
              <strong>Chave PIX</strong>
              <span>{dadosDoacao.chave_pix}</span>
            </div>

            <button type="button" className="pix-copy-button" onClick={copiarChavePix}>
              Copiar chave PIX
            </button>
            {copiado && <span className="pix-copy-feedback">Copiado!</span>}
          </article>

          <article className="donation-card bank-card">
            <span className="card-label">Dados bancários</span>
            <h2>Transferência</h2>

            {hasBankData ? (
              <dl className="bank-data">
                {bankFields.map(([label, key]) => (
                  <div key={key}>
                    <dt>{label}</dt>
                    <dd>{dadosDoacao[key] || "Não informado"}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="bank-empty">Dados bancários ainda não cadastrados.</p>
            )}
          </article>
        </section>
      )}

      {/* ── Seção: Doação de itens ─────────────────────── */}
      <section className="doe-item-section">
        <div className="doe-item-heading">
          <h2>Doe itens ou serviços</h2>
          <p>
            Além do dinheiro, você também pode contribuir com ração, remédios,
            materiais de limpeza, serviços veterinários ou qualquer outro recurso.
            Preencha o formulário e entraremos em contato.
          </p>
        </div>

        <form className="doe-item-form" onSubmit={enviarItemForm}>
          <label>
            Nome *
            <input
              name="nome"
              type="text"
              value={itemForm.nome}
              onChange={alterarItemCampo}
              required
              maxLength="100"
              placeholder="Seu nome completo"
            />
          </label>

          <div className="doe-item-form-row">
            <label>
              Telefone *
              <input
                name="telefone"
                type="tel"
                value={itemForm.telefone}
                onChange={alterarItemCampo}
                required
                inputMode="tel"
                autoComplete="tel-national"
                placeholder="(49) 99999-9999"
                maxLength="15"
              />
            </label>

            <label>
              E-mail
              <input
                name="email"
                type="email"
                value={itemForm.email}
                onChange={alterarItemCampo}
                placeholder="Opcional"
              />
            </label>
          </div>

          <label>
            O que você deseja doar? *
            <textarea
              name="descricao"
              value={itemForm.descricao}
              onChange={alterarItemCampo}
              required
              minLength="10"
              rows="5"
              placeholder="Descreva o item, quantidade, condição (se aplicável) e qualquer informação relevante..."
            />
          </label>

          {itemSucesso && <p className="doe-item-message success">{itemSucesso}</p>}
          {itemErro && <p className="doe-item-message error">{itemErro}</p>}

          <button type="submit" disabled={itemEnviando}>
            {itemEnviando ? "Enviando..." : "Enviar doação"}
          </button>
        </form>

        {/* ── Lista de doações recebidas (admin) ─────── */}
        {podeEditar && (
          <div className="doe-item-admin">
            <div className="doe-item-admin-header">
              <h2>Doações de itens recebidas</h2>
              <p>Lista de pessoas que ofereceram itens ou serviços.</p>
            </div>

            {itensLoading && <LoadingSpinner label="Carregando doações..." />}

            {!itensLoading && itensErro && (
              <EmptyState
                title="Não foi possível carregar as doações."
                description={itensErro}
              />
            )}

            {!itensLoading && !itensErro && itens.length === 0 && (
              <EmptyState
                title="Nenhuma doação de itens recebida até o momento."
                description="As doações enviadas pelo formulário aparecerão aqui."
              />
            )}

            {!itensLoading && !itensErro && itens.length > 0 && (
              <div className="doe-item-list">
                {itens.map((item) => (
                  <article className="doe-item-card" key={item.id}>
                    <div className="doe-item-card-header">
                      <div>
                        <h3>{item.nome}</h3>
                        <p>{formatarData(item.created_at)}</p>
                      </div>
                      <button
                        type="button"
                        className="doe-item-delete-button"
                        onClick={() => setItemParaExclusao(item)}
                      >
                        Remover
                      </button>
                    </div>

                    <dl className="doe-item-card-details">
                      <div>
                        <dt>Telefone</dt>
                        <dd>{item.telefone}</dd>
                      </div>
                      {item.email && (
                        <div>
                          <dt>E-mail</dt>
                          <dd>{item.email}</dd>
                        </div>
                      )}
                    </dl>

                    <div className="doe-item-card-descricao">
                      <span>O que deseja doar</span>
                      <p>{item.descricao}</p>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {erroExclusao && (
              <p className="doe-item-admin-message error">{erroExclusao}</p>
            )}
          </div>
        )}
      </section>

      {/* ── Modal PIX/banco ───────────────────────────── */}
      {modalVisivel && (
        <div className="doe-modal-backdrop" onClick={fecharModal}>
          <div className="doe-modal" onClick={(event) => event.stopPropagation()}>
            <div className="doe-modal-header">
              <h2>{modoFormulario === "editar" ? "Editar dados de doação" : "Cadastrar dados de doação"}</h2>
              <button type="button" className="doe-modal-close" onClick={fecharModal}>
                Fechar
              </button>
            </div>

            <form className="doe-form" onSubmit={enviarFormulario}>
              <div className="doe-form-grid">
                <label>
                  Chave PIX
                  <input name="chave_pix" value={formulario.chave_pix} onChange={alterarCampo} required />
                </label>
                <label>
                  Banco
                  <input name="banco" value={formulario.banco} onChange={alterarCampo} />
                </label>
                <label>
                  Agência
                  <input name="agencia" value={formulario.agencia} onChange={alterarCampo} />
                </label>
                <label>
                  Conta
                  <input name="conta" value={formulario.conta} onChange={alterarCampo} />
                </label>
                <label>
                  Tipo de conta
                  <input name="tipo_conta" value={formulario.tipo_conta} onChange={alterarCampo} />
                </label>
                <label>
                  CNPJ
                  <input name="cnpj" value={formulario.cnpj} onChange={alterarCampo} />
                </label>
                <label>
                  Favorecido
                  <input name="favorecido" value={formulario.favorecido} onChange={alterarCampo} />
                </label>
                <label>
                  Status
                  <select name="ativo" value={formulario.ativo ? "true" : "false"} onChange={alterarCampo}>
                    <option value="true">Ativo</option>
                    <option value="false">Inativo</option>
                  </select>
                </label>
              </div>

              <label className="doe-form-full">
                Descrição
                <textarea name="descricao" rows="4" value={formulario.descricao} onChange={alterarCampo} />
              </label>

              <div className="doe-form-row">
                <label className="doe-form-upload">
                  QR Code
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => lidarComQrCode(event.target.files?.[0] || null)}
                  />
                </label>
                <label className="doe-form-check">
                  <input
                    type="checkbox"
                    checked={removerQrCode}
                    onChange={(event) => alternarRemocaoQrCode(event.target.checked)}
                  />
                  Excluir imagem atual
                </label>
              </div>

              {currentPreview && (
                <div className="doe-preview">
                  <img src={currentPreview} alt="Pré-visualização do QR Code" />
                </div>
              )}

              {erroFormulario && <p className="doe-form-error">{erroFormulario}</p>}

              <div className="doe-form-actions">
                <button type="button" className="doe-form-button secondary" onClick={fecharModal}>
                  Cancelar
                </button>
                <button type="submit" className="doe-form-button primary" disabled={salvando}>
                  {salvando ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(itemParaExclusao)}
        title="Remover doação"
        message={`Tem certeza que deseja remover a doação de "${itemParaExclusao?.nome || ""}"?`}
        confirmLabel="Remover"
        onConfirm={confirmarExclusaoItem}
        onClose={() => setItemParaExclusao(null)}
      />
    </div>
  );
}

export default Doe;
