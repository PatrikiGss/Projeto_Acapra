import { useEffect, useState } from "react";
import api, { getMediaURL } from "../../services/api";
import { useAdminAccess } from "../../hooks/useAdminAccess";
import ConfirmModal from "../../components/ui/ConfirmModal";
import { validateDocumentFile, DOCUMENT_ACCEPT } from "../../utils/upload";
import "./Transparencia.css";

const descricaoIndicador = {
  animais_resgatados: "animais tirados das ruas e maus-tratos",
  castracoes: "procedimentos realizados em parceria com clínicas locais",
  adocoes: "animais que encontraram um lar amoroso",
};

const formDocVazio = { nome: "", descricao: "", ativo: true, ordem: 0 };

function Transparencia() {
  const { podeEditar } = useAdminAccess("transparencia");

  // --- Indicadores de impacto ---
  const [indicadores, setIndicadores] = useState([]);
  const [loadingInd, setLoadingInd] = useState(true);
  const [modalInd, setModalInd] = useState({ aberto: false, dados: null });
  const [valorInd, setValorInd] = useState(0);
  const [salvandoInd, setSalvandoInd] = useState(false);
  const [erroInd, setErroInd] = useState("");

  // --- Documentos Institucionais ---
  const [documentos, setDocumentos] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [erroDocs, setErroDocs] = useState(false);

  const [modalDoc, setModalDoc] = useState({ aberto: false, modo: "criar", dados: null });
  const [formDoc, setFormDoc] = useState(formDocVazio);
  const [arquivoFile, setArquivoFile] = useState(null);
  const [removerArquivo, setRemoverArquivo] = useState(false);
  const [salvandoDoc, setSalvandoDoc] = useState(false);
  const [confirmacaoTransp, setConfirmacaoTransp] = useState(null);
  const [erroDoc, setErroDoc] = useState("");

  // ---- Loaders ----
  const carregarDocumentos = () => {
    setLoadingDocs(true);
    api
      .get("/api/transparencia/documentos/")
      .then((res) => { setDocumentos(res.data || []); setErroDocs(false); })
      .catch(() => setErroDocs(true))
      .finally(() => setLoadingDocs(false));
  };

  const carregarIndicadores = () => {
    setLoadingInd(true);
    api
      .get("/api/transparencia/indicadores/")
      .then((res) => { setIndicadores(res.data || []); })
      .catch(() => setIndicadores([]))
      .finally(() => setLoadingInd(false));
  };

  useEffect(() => {
    carregarDocumentos();
    carregarIndicadores();
  }, []);

  // ---- Documento Institucional ----
  const abrirCriarDocumento = () => {
    setFormDoc(formDocVazio);
    setArquivoFile(null);
    setRemoverArquivo(false);
    setErroDoc("");
    setModalDoc({ aberto: true, modo: "criar", dados: null });
  };

  const abrirEditarDocumento = (doc) => {
    setFormDoc({ nome: doc.nome, descricao: doc.descricao, ativo: doc.ativo, ordem: doc.ordem });
    setArquivoFile(null);
    setRemoverArquivo(false);
    setErroDoc("");
    setModalDoc({ aberto: true, modo: "editar", dados: doc });
  };

  const fecharModalDoc = () => { setModalDoc((p) => ({ ...p, aberto: false })); setSalvandoDoc(false); };

  const salvarDocumento = async (e) => {
    e.preventDefault();
    setSalvandoDoc(true);
    setErroDoc("");
    const payload = new FormData();
    payload.append("nome", formDoc.nome);
    payload.append("descricao", formDoc.descricao);
    payload.append("ativo", formDoc.ativo ? "true" : "false");
    payload.append("ordem", formDoc.ordem);
    if (arquivoFile) payload.append("arquivo", arquivoFile);
    else if (removerArquivo) payload.append("remover_arquivo", "true");
    try {
      if (modalDoc.modo === "criar") await api.post("/api/transparencia/documentos/", payload);
      else await api.patch(`/api/transparencia/documentos/${modalDoc.dados.id}/`, payload);
      carregarDocumentos();
      fecharModalDoc();
    } catch (err) {
      const data = err.response?.data;
      setErroDoc(data && typeof data === "object" ? Object.values(data).flat().join(" ") : "Erro ao salvar documento.");
    } finally { setSalvandoDoc(false); }
  };

  const excluirDocumento = (doc) => {
    setConfirmacaoTransp({ tipo: "documento", item: doc, mensagem: `Remover o documento "${doc.nome}"?` });
  };

  // ---- Indicador de impacto ----
  const abrirEditarIndicador = (ind) => {
    setValorInd(ind.valor);
    setErroInd("");
    setModalInd({ aberto: true, dados: ind });
  };

  const fecharModalInd = () => { setModalInd((p) => ({ ...p, aberto: false })); setSalvandoInd(false); };

  const confirmarAcaoTransp = async () => {
    if (!confirmacaoTransp) return;
    const { tipo, item } = confirmacaoTransp;
    if (tipo === "documento") {
      try {
        await api.delete(`/api/transparencia/documentos/${item.id}/`);
      } catch { /* 404/erro: a releitura abaixo reflete o estado real do servidor */ }
      // Sucesso ou já removido: tira da lista e re-busca para refletir o servidor.
      setDocumentos((lista) => lista.filter((d) => d.id !== item.id));
      carregarDocumentos();
    }
    setConfirmacaoTransp(null);
  };

  const salvarIndicador = async (e) => {
    e.preventDefault();
    setSalvandoInd(true);
    setErroInd("");
    try {
      await api.patch(`/api/transparencia/indicadores/${modalInd.dados.id}/`, { valor: valorInd });
      carregarIndicadores();
      fecharModalInd();
    } catch (err) {
      const data = err.response?.data;
      setErroInd(data && typeof data === "object" ? Object.values(data).flat().join(" ") : "Erro ao salvar indicador.");
    } finally { setSalvandoInd(false); }
  };

  return (
    <div className="transp-page">
      <div className="transp-content">

        {/* IMPACTO */}
        <section className="transp-impacto" aria-labelledby="impacto-titulo">
          <h2 id="impacto-titulo" className="transp-section-title">Nosso impacto</h2>
          <p className="transp-section-sub">Números atualizados pela equipe da ACAPRA</p>
          <div className="transp-metricas">
            {indicadores.map((ind) => (
              <article key={ind.id} className="transp-metrica-card">
                <span className="transp-metrica-valor">
                  {loadingInd ? "—" : Number(ind.valor).toLocaleString("pt-BR")}
                </span>
                <strong className="transp-metrica-rotulo">{ind.chave_display}</strong>
                <p className="transp-metrica-desc">{descricaoIndicador[ind.chave] || ""}</p>
                {podeEditar && (
                  <button type="button" className="transp-metrica-btn" onClick={() => abrirEditarIndicador(ind)}>
                    Editar
                  </button>
                )}
              </article>
            ))}
          </div>
        </section>

        {/* DOCUMENTOS INSTITUCIONAIS */}
        <section className="transp-dimensao" aria-labelledby="institucional-titulo">
          <div className="transp-dimensao-header">
            <div>
              <h2 id="institucional-titulo">Documentos Institucionais</h2>
              <p>Comprove nossa legalidade e governança</p>
            </div>
            {podeEditar && (
              <button type="button" className="transp-header-btn" onClick={abrirCriarDocumento}>
                + Novo documento
              </button>
            )}
          </div>

          {loadingDocs && <p className="transp-estado">Carregando documentos...</p>}
          {!loadingDocs && erroDocs && <p className="transp-estado erro">Não foi possível carregar os documentos.</p>}
          {!loadingDocs && !erroDocs && documentos.length === 0 && !podeEditar && (
            <p className="transp-estado">Nenhum documento publicado ainda.</p>
          )}

          {!loadingDocs && !erroDocs && (
            <div className="transp-doc-lista">
              {documentos.map((doc) => (
                <div key={doc.id} className="transp-doc-item">
                  <div className="transp-doc-info">
                    <span className="transp-doc-nome">{doc.nome}</span>
                    {doc.descricao && <span className="transp-doc-desc">{doc.descricao}</span>}
                  </div>
                  <div className="transp-doc-acoes">
                    {doc.arquivo ? (
                      <a href={getMediaURL(doc.arquivo)} target="_blank" rel="noopener noreferrer" className="transp-doc-badge disponivel">
                        Download
                      </a>
                    ) : (
                      <span className="transp-doc-badge em-breve">Em breve</span>
                    )}
                    {podeEditar && (
                      <>
                        <button type="button" className="transp-doc-btn" onClick={() => abrirEditarDocumento(doc)}>Editar</button>
                        <button type="button" className="transp-doc-btn danger" onClick={() => excluirDocumento(doc)}>Excluir</button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* CTA */}
        <section className="transp-cta">
          <h2>Dúvidas ou sugestões?</h2>
          <p>Entre em contato conosco. Queremos ser cada vez mais transparentes e sua opinião nos ajuda a melhorar.</p>
          <a href="mailto:acapra@email.com" className="transp-cta-link">Falar com a ACAPRA</a>
        </section>
      </div>

      {/* MODAL DOCUMENTO INSTITUCIONAL */}
      {modalDoc.aberto && podeEditar && (
        <div className="transp-modal-backdrop" onClick={fecharModalDoc}>
          <div className="transp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="transp-modal-header">
              <h2>{modalDoc.modo === "criar" ? "Novo documento" : "Editar documento"}</h2>
              <button type="button" className="transp-modal-close" onClick={fecharModalDoc}>Fechar</button>
            </div>
            <form className="transp-form" onSubmit={salvarDocumento}>
              <label>Nome do documento<input value={formDoc.nome} onChange={(e) => setFormDoc({ ...formDoc, nome: e.target.value })} required maxLength={200} /></label>
              <label>Descrição (opcional)<input value={formDoc.descricao} onChange={(e) => setFormDoc({ ...formDoc, descricao: e.target.value })} maxLength={300} /></label>
              <div className="transp-form-row">
                <label>Ordem<input type="number" min="0" value={formDoc.ordem} onChange={(e) => setFormDoc({ ...formDoc, ordem: Number(e.target.value) })} /></label>
                {modalDoc.modo === "editar" && (
                  <label>Status
                    <select value={formDoc.ativo ? "true" : "false"} onChange={(e) => setFormDoc({ ...formDoc, ativo: e.target.value === "true" })}>
                      <option value="true">Ativo</option>
                      <option value="false">Inativo</option>
                    </select>
                  </label>
                )}
              </div>
              <label>Arquivo (PDF ou imagem)
                <input type="file" accept={DOCUMENT_ACCEPT} onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  const erroValidacao = file ? validateDocumentFile(file) : null;
                  if (erroValidacao) { setErroDoc(erroValidacao); e.target.value = ""; return; }
                  setErroDoc("");
                  setArquivoFile(file);
                  setRemoverArquivo(false);
                }} />
              </label>
              {modalDoc.dados?.arquivo && !arquivoFile && (
                <label className="transp-form-check">
                  <input type="checkbox" checked={removerArquivo} onChange={(e) => setRemoverArquivo(e.target.checked)} />
                  Remover arquivo atual
                </label>
              )}
              {erroDoc && <p className="transp-form-erro">{erroDoc}</p>}
              <div className="transp-modal-footer">
                <button type="button" className="secondary" onClick={fecharModalDoc}>Cancelar</button>
                <button type="submit" disabled={salvandoDoc}>{salvandoDoc ? "Salvando..." : "Salvar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL INDICADOR DE IMPACTO */}
      {modalInd.aberto && podeEditar && (
        <div className="transp-modal-backdrop" onClick={fecharModalInd}>
          <div className="transp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="transp-modal-header">
              <h2>Editar indicador</h2>
              <button type="button" className="transp-modal-close" onClick={fecharModalInd}>Fechar</button>
            </div>
            <form className="transp-form" onSubmit={salvarIndicador}>
              <label>{modalInd.dados?.chave_display}
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={valorInd}
                  onChange={(e) => setValorInd(e.target.value)}
                  required
                />
              </label>
              {erroInd && <p className="transp-form-erro">{erroInd}</p>}
              <div className="transp-modal-footer">
                <button type="button" className="secondary" onClick={fecharModalInd}>Cancelar</button>
                <button type="submit" disabled={salvandoInd}>{salvandoInd ? "Salvando..." : "Salvar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(confirmacaoTransp)}
        title="Confirmar remoção"
        message={confirmacaoTransp?.mensagem || ""}
        confirmLabel="Remover"
        onConfirm={confirmarAcaoTransp}
        onClose={() => setConfirmacaoTransp(null)}
      />
    </div>
  );
}

export default Transparencia;
