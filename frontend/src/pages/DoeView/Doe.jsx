import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import { isLoggedIn, subscribeToAuthChanges } from "../../utils/auth";
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

function Doe() {
  const [dadosList, setDadosList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [estaLogado, setEstaLogado] = useState(isLoggedIn());
  const [modalAberto, setModalAberto] = useState(false);
  const [modoFormulario, setModoFormulario] = useState("criar");
  const [dadosEditando, setDadosEditando] = useState(null);
  const [formulario, setFormulario] = useState(formVazio);
  const [qrCodeFile, setQrCodeFile] = useState(null);
  const [previewQrCode, setPreviewQrCode] = useState("");
  const [removerQrCode, setRemoverQrCode] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erroFormulario, setErroFormulario] = useState("");

  const sincronizarLista = () => {
    setLoading(true);

    api
      .get("/api/doacoes/pix/")
      .then((response) => {
        setDadosList(response.data || []);
        setError(false);
      })
      .catch((erro) => {
        console.error(erro);
        setError(true);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let ignorado = false;

    Promise.resolve().then(() => {
      if (!ignorado) {
        sincronizarLista();
      }
    });

    return () => {
      ignorado = true;
    };
  }, []);

  useEffect(() => {
    const sincronizarAuth = () => {
      setEstaLogado(isLoggedIn());
    };

    sincronizarAuth();
    return subscribeToAuthChanges(sincronizarAuth);
  }, []);

  useEffect(() => {
    return () => {
      if (previewQrCode.startsWith("blob:")) {
        URL.revokeObjectURL(previewQrCode);
      }
    };
  }, [previewQrCode]);

  const dadosDoacao = useMemo(() => dadosList[0] || null, [dadosList]);
  const hasBankData = dadosDoacao && bankFields.some(([, key]) => dadosDoacao[key]);
  const qrCodeAtual = dadosEditando?.qr_code || dadosDoacao?.qr_code || "";

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
    const data = errorResponse.response?.data;
    if (!data) return "Não foi possível salvar os dados de doação.";
    if (typeof data === "string") return data;
    if (typeof data === "object") {
      const mensagens = Object.values(data).flat().filter(Boolean);
      if (mensagens.length > 0) return mensagens.join(" ");
    }
    return "Não foi possível salvar os dados de doação.";
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

      await sincronizarLista();
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

        {estaLogado && (
          <button
            type="button"
            className="doe-admin-button"
            onClick={dadosDoacao ? abrirEdicao : abrirCriacao}
          >
            {dadosDoacao ? "Editar dados de doação" : "Cadastrar dados de doação"}
          </button>
        )}
      </section>

      {loading && <div className="donation-message">Carregando dados de doação...</div>}

      {!loading && error && (
        <div className="donation-message">Não foi possível carregar os dados de doação.</div>
      )}

      {!loading && !error && !dadosDoacao && (
        <div className="donation-message">Nenhum dado de doação ativo foi cadastrado.</div>
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
                <div className="qr-placeholder">Sem imagem</div>
              )}
            </div>

            <div className="pix-key-box">
              <strong>Chave PIX</strong>
              <span>{dadosDoacao.chave_pix}</span>
            </div>
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

      {modalAberto && estaLogado && (
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
    </div>
  );
}

export default Doe;
