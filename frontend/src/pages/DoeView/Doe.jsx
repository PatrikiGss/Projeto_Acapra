import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import { useAdminAccess } from "../../hooks/useAdminAccess";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import EmptyState from "../../components/ui/EmptyState";
import { getResponseItems } from "../../utils/collection";
import { getApiErrorMessage } from "../../utils/errorUtils";
import { logError } from "../../utils/logger";
import { validateImageFile, IMAGE_ACCEPT } from "../../utils/upload";
import { formatBrazilianPhone, toBrazilianPhoneE164, isValidBrazilianPhone } from "../../utils/phone";
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

const categoriasOferta = [
  ["alimento", "Alimento / Ração"],
  ["vestuario", "Roupa / Cobertor"],
  ["higiene", "Higiene / Limpeza"],
  ["medicamento", "Medicamento"],
  ["acessorio", "Acessório / Brinquedo"],
  ["outros", "Outros"],
];

const ofertaVazia = {
  nome_doador: "",
  telefone: "",
  item: "",
  categoria: "alimento",
  quantidade: "",
  observacoes: "",
};

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
  const [ofertaForm, setOfertaForm] = useState(ofertaVazia);
  const [enviandoOferta, setEnviandoOferta] = useState(false);
  const [ofertaSucesso, setOfertaSucesso] = useState("");
  const [ofertaErro, setOfertaErro] = useState("");

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
        logError("Doe", erro);
        setError(true);
      } finally {
        if (ativo) {
          setLoading(false);
        }
      }
    };

    void carregar();

    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (previewQrCode.startsWith("blob:")) {
        URL.revokeObjectURL(previewQrCode);
      }
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
      logError("Doe", erro);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const limparPreview = () => {
    if (previewQrCode.startsWith("blob:")) {
      URL.revokeObjectURL(previewQrCode);
    }
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

  const extrairMensagemErro = (errorResponse) => {
    return getApiErrorMessage(errorResponse, "Não foi possível salvar os dados de doação.");
  };

  const alterarCampo = (event) => {
    const { name, value, type, checked } = event.target;
    const novoValor =
      type === "checkbox" ? checked : name === "ativo" ? value === "true" : value;

    setFormulario((atual) => ({
      ...atual,
      [name]: novoValor,
    }));
  };

  const lidarComQrCode = (file) => {
    if (file) {
      const erroValidacao = validateImageFile(file);
      if (erroValidacao) {
        setErroFormulario(erroValidacao);
        return;
      }
    }
    setErroFormulario("");
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

  const alterarOferta = (event) => {
    const { name, value } = event.target;
    const novoValor = name === "telefone" ? formatBrazilianPhone(value) : value;
    setOfertaForm((atual) => ({ ...atual, [name]: novoValor }));
  };

  const enviarOferta = async (event) => {
    event.preventDefault();
    setOfertaErro("");
    setOfertaSucesso("");

    if (!isValidBrazilianPhone(ofertaForm.telefone)) {
      setOfertaErro("Informe um telefone válido com DDD, ex.: (49) 99999-9999.");
      return;
    }

    setEnviandoOferta(true);

    try {
      const payload = { ...ofertaForm, telefone: toBrazilianPhoneE164(ofertaForm.telefone) };
      const { data } = await api.post("/api/doacoes/ofertas/", payload);
      setOfertaSucesso(data?.detail || "Oferta registrada com sucesso. Em breve entraremos em contato!");
      setOfertaForm(ofertaVazia);
    } catch (erro) {
      logError("Doe", erro);
      setOfertaErro(getApiErrorMessage(erro, "Não foi possível registrar sua oferta. Tente novamente."));
    } finally {
      setEnviandoOferta(false);
    }
  };

  const copiarChavePix = async () => {
    if (!dadosDoacao?.chave_pix) return;

    try {
      await navigator.clipboard.writeText(dadosDoacao.chave_pix);
      setCopiado(true);
    } catch (error) {
      logError("Doe", error);
      setErroFormulario("Não foi possível copiar a chave PIX.");
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

    if (qrCodeFile) {
      payload.append("qr_code", qrCodeFile);
    }

    if (removerQrCode) {
      payload.append("remover_qr_code", "true");
    }

    try {
      if (modoFormulario === "editar" && dadosEditando) {
        await api.patch(`/api/doacoes/pix/${dadosEditando.id}/`, payload);
      } else {
        await api.post("/api/doacoes/pix/", payload);
      }

      await atualizarLista();
      fecharModal();
    } catch (errorResponse) {
      setErroFormulario(extrairMensagemErro(errorResponse));
    } finally {
      setSalvando(false);
    }
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

      <section className="doe-oferta" aria-labelledby="oferta-titulo">
        <div className="doe-oferta-intro">
          <span className="card-label">Doe um item</span>
          <h2 id="oferta-titulo">Quero doar algo</h2>
          <p>
            Tem ração, roupinha, cobertor, remédio ou qualquer item que possa ajudar
            nossos animais? Cadastre abaixo e nós entramos em contato para combinar a coleta.
          </p>
        </div>

        <form className="doe-oferta-form" onSubmit={enviarOferta}>
          <div className="doe-oferta-grid">
            <label>
              Seu nome
              <input name="nome_doador" value={ofertaForm.nome_doador} onChange={alterarOferta} required maxLength={120} />
            </label>
            <label>
              Telefone / WhatsApp
              <input
                name="telefone"
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                value={ofertaForm.telefone}
                onChange={alterarOferta}
                required
                maxLength={15}
                placeholder="(49) 99999-9999"
              />
            </label>
            <label>
              O que deseja doar
              <input name="item" value={ofertaForm.item} onChange={alterarOferta} required maxLength={200} placeholder="Ex.: ração, coleira, cobertor" />
            </label>
            <label>
              Categoria
              <select name="categoria" value={ofertaForm.categoria} onChange={alterarOferta}>
                {categoriasOferta.map(([valor, rotulo]) => (
                  <option key={valor} value={valor}>{rotulo}</option>
                ))}
              </select>
            </label>
            <label>
              Quantidade (opcional)
              <input name="quantidade" value={ofertaForm.quantidade} onChange={alterarOferta} maxLength={60} placeholder="Ex.: 3 sacos, 5 peças, 2 kg" />
            </label>
          </div>

          <label className="doe-oferta-full">
            Observações (opcional)
            <textarea name="observacoes" rows="3" value={ofertaForm.observacoes} onChange={alterarOferta} placeholder="Estado do item, melhor horário para contato, etc." />
          </label>

          {ofertaErro && <p className="doe-form-error">{ofertaErro}</p>}
          {ofertaSucesso && <p className="doe-oferta-sucesso">{ofertaSucesso}</p>}

          <button type="submit" className="doe-form-button primary" disabled={enviandoOferta}>
            {enviandoOferta ? "Enviando..." : "Quero doar"}
          </button>
        </form>
      </section>

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
                  <input
                    name="chave_pix"
                    value={formulario.chave_pix}
                    onChange={alterarCampo}
                    required
                  />
                </label>

                <label>
                  Banco
                  <input
                    name="banco"
                    value={formulario.banco}
                    onChange={alterarCampo}
                  />
                </label>

                <label>
                  Agência
                  <input
                    name="agencia"
                    value={formulario.agencia}
                    onChange={alterarCampo}
                  />
                </label>

                <label>
                  Conta
                  <input
                    name="conta"
                    value={formulario.conta}
                    onChange={alterarCampo}
                  />
                </label>

                <label>
                  Tipo de conta
                  <input
                    name="tipo_conta"
                    value={formulario.tipo_conta}
                    onChange={alterarCampo}
                  />
                </label>

                <label>
                  CNPJ
                  <input
                    name="cnpj"
                    value={formulario.cnpj}
                    onChange={alterarCampo}
                  />
                </label>

                <label>
                  Favorecido
                  <input
                    name="favorecido"
                    value={formulario.favorecido}
                    onChange={alterarCampo}
                  />
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
                <textarea
                  name="descricao"
                  rows="4"
                  value={formulario.descricao}
                  onChange={alterarCampo}
                />
              </label>

              <div className="doe-form-row">
                <label className="doe-form-upload">
                  QR Code
                  <input
                    type="file"
                    accept={IMAGE_ACCEPT}
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
    </div>
  );
}

export default Doe;
