import { useEffect, useMemo, useState } from "react";
import api, { getMediaURL } from "../../services/api";
import { useAdminAccess } from "../../hooks/useAdminAccess";
import "./Transparencia.css";

const metricas = [
  { valor: "—", rotulo: "Animais resgatados", descricao: "animais tirados das ruas e maus-tratos" },
  { valor: "—", rotulo: "Castrações realizadas", descricao: "procedimentos realizados em parceria com clínicas locais" },
  { valor: "—", rotulo: "Adoções bem-sucedidas", descricao: "animais que encontraram um lar amoroso" },
];

const documentosInstitucionais = [
  { nome: "Estatuto Social", descricao: "Documento que rege a organização da ACAPRA" },
  { nome: "Ata de Eleição da Diretoria", descricao: "Registro da última assembleia de eleição" },
  { nome: "CNPJ", descricao: "Cadastro Nacional de Pessoa Jurídica" },
  { nome: "Alvará de Funcionamento", descricao: "Autorização municipal de funcionamento" },
  { nome: "Política de Adoção Responsável", descricao: "Critérios e termos do processo de adoção" },
];

const parceiros = [
  { nome: "Clínicas Veterinárias Parceiras", descricao: "Estabelecimentos que oferecem atendimento com desconto ou gratuito" },
  { nome: "Pet Shops Apoiadores", descricao: "Lojas que doam ração, acessórios e materiais de higiene" },
  { nome: "Apoiadores Locais", descricao: "Empresas e pessoas de São Joaquim que apoiam a causa" },
];

function formatarData(data) {
  if (!data) return "";
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

function formatarMoeda(valor) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(valor) || 0);
}

function calcularTotal(movimentos) {
  return movimentos.reduce((soma, m) => soma + (Number(m.valor) || 0), 0);
}

const formCatVazio = { nome: "", tipo: "entrada", ativo: true };
const formMovVazio = { categoria: "", descricao: "", valor: "", data: "", ativo: true };

function CardDocumento({ nome, descricao }) {
  return (
    <div className="transp-doc-item">
      <div className="transp-doc-info">
        <span className="transp-doc-nome">{nome}</span>
        <span className="transp-doc-desc">{descricao}</span>
      </div>
      <span className="transp-doc-badge em-breve">Em breve</span>
    </div>
  );
}

function Transparencia() {
  const { podeEditar } = useAdminAccess("transparencia");

  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);
  const [abertas, setAbertas] = useState(new Set());

  const [modalCat, setModalCat] = useState({ aberto: false, modo: "criar", dados: null });
  const [formCat, setFormCat] = useState(formCatVazio);
  const [salvandoCat, setSalvandoCat] = useState(false);
  const [erroCat, setErroCat] = useState("");

  const [modalMov, setModalMov] = useState({ aberto: false, modo: "criar", dados: null });
  const [formMov, setFormMov] = useState(formMovVazio);
  const [comprovanteFile, setComprovanteFile] = useState(null);
  const [removerComprovante, setRemoverComprovante] = useState(false);
  const [salvandoMov, setSalvandoMov] = useState(false);
  const [erroMov, setErroMov] = useState("");

  const carregarCategorias = () => {
    setLoading(true);
    api
      .get("/api/transparencia/categorias/")
      .then((res) => {
        setCategorias(res.data || []);
        setErro(false);
      })
      .catch(() => setErro(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    carregarCategorias();
  }, []);

  const entradas = useMemo(() => categorias.filter((c) => c.tipo === "entrada"), [categorias]);
  const saidas = useMemo(() => categorias.filter((c) => c.tipo === "saida"), [categorias]);

  const togglePasta = (id) => {
    setAbertas((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // --- Categoria ---
  const abrirCriarCategoria = (tipo) => {
    setFormCat({ ...formCatVazio, tipo });
    setErroCat("");
    setModalCat({ aberto: true, modo: "criar", dados: null });
  };

  const abrirEditarCategoria = (cat, e) => {
    e.stopPropagation();
    setFormCat({ nome: cat.nome, tipo: cat.tipo, ativo: cat.ativo });
    setErroCat("");
    setModalCat({ aberto: true, modo: "editar", dados: cat });
  };

  const fecharModalCat = () => {
    setModalCat((p) => ({ ...p, aberto: false }));
    setSalvandoCat(false);
  };

  const salvarCategoria = async (e) => {
    e.preventDefault();
    setSalvandoCat(true);
    setErroCat("");
    try {
      if (modalCat.modo === "criar") {
        await api.post("/api/transparencia/categorias/", formCat);
      } else {
        await api.patch(`/api/transparencia/categorias/${modalCat.dados.id}/`, formCat);
      }
      carregarCategorias();
      fecharModalCat();
    } catch (err) {
      const data = err.response?.data;
      setErroCat(
        data && typeof data === "object"
          ? Object.values(data).flat().join(" ")
          : "Erro ao salvar categoria."
      );
    } finally {
      setSalvandoCat(false);
    }
  };

  const excluirCategoria = async (cat, e) => {
    e.stopPropagation();
    if (!window.confirm(`Remover a categoria "${cat.nome}" e todos os seus registros?`)) return;
    try {
      await api.delete(`/api/transparencia/categorias/${cat.id}/`);
      carregarCategorias();
    } catch {
      alert("Não foi possível remover a categoria.");
    }
  };

  // --- Movimento ---
  const abrirCriarMovimento = (categoriaId, e) => {
    e.stopPropagation();
    setFormMov({ ...formMovVazio, categoria: categoriaId });
    setComprovanteFile(null);
    setRemoverComprovante(false);
    setErroMov("");
    setModalMov({ aberto: true, modo: "criar", dados: null });
  };

  const abrirEditarMovimento = (mov, e) => {
    e.stopPropagation();
    setFormMov({
      categoria: mov.categoria,
      descricao: mov.descricao,
      valor: mov.valor,
      data: mov.data,
      ativo: mov.ativo,
    });
    setComprovanteFile(null);
    setRemoverComprovante(false);
    setErroMov("");
    setModalMov({ aberto: true, modo: "editar", dados: mov });
  };

  const fecharModalMov = () => {
    setModalMov((p) => ({ ...p, aberto: false }));
    setSalvandoMov(false);
  };

  const salvarMovimento = async (e) => {
    e.preventDefault();
    setSalvandoMov(true);
    setErroMov("");

    const payload = new FormData();
    payload.append("categoria", formMov.categoria);
    payload.append("descricao", formMov.descricao);
    payload.append("valor", formMov.valor);
    payload.append("data", formMov.data);
    payload.append("ativo", formMov.ativo ? "true" : "false");
    if (comprovanteFile) {
      payload.append("comprovante", comprovanteFile);
    } else if (removerComprovante) {
      payload.append("remover_comprovante", "true");
    }

    try {
      if (modalMov.modo === "criar") {
        await api.post("/api/transparencia/movimentos/", payload);
      } else {
        await api.patch(`/api/transparencia/movimentos/${modalMov.dados.id}/`, payload);
      }
      carregarCategorias();
      fecharModalMov();
    } catch (err) {
      const data = err.response?.data;
      setErroMov(
        data && typeof data === "object"
          ? Object.values(data).flat().join(" ")
          : "Erro ao salvar registro."
      );
    } finally {
      setSalvandoMov(false);
    }
  };

  const excluirMovimento = async (mov, e) => {
    e.stopPropagation();
    if (!window.confirm(`Remover o registro "${mov.descricao}"?`)) return;
    try {
      await api.delete(`/api/transparencia/movimentos/${mov.id}/`);
      carregarCategorias();
    } catch {
      alert("Não foi possível remover o registro.");
    }
  };

  function renderGrupo(tipo, lista) {
    const totalGrupo = lista.reduce((soma, cat) => soma + calcularTotal(cat.movimentos || []), 0);
    const labelTipo = tipo === "entrada" ? "Entradas" : "Saídas";

    return (
      <div className="transp-grupo">
        <div className={`transp-grupo-titulo ${tipo}`}>
          <span>{labelTipo}</span>
          <span className="transp-grupo-total">{formatarMoeda(totalGrupo)}</span>
        </div>

        {lista.map((cat) => {
          const aberta = abertas.has(cat.id);
          const totalCat = calcularTotal(cat.movimentos || []);

          return (
            <div key={cat.id} className="transp-pasta">
              <div className="transp-pasta-header" onClick={() => togglePasta(cat.id)}>
                <span className="transp-pasta-icone">{aberta ? "▾" : "▸"}</span>
                <span className="transp-pasta-nome">{cat.nome}</span>
                <span className="transp-pasta-count">{(cat.movimentos || []).length} registro(s)</span>
                <span className={`transp-pasta-total ${tipo}`}>{formatarMoeda(totalCat)}</span>
                {podeEditar && (
                  <div className="transp-pasta-acoes">
                    <button type="button" onClick={(e) => abrirEditarCategoria(cat, e)}>Editar</button>
                    <button type="button" className="danger" onClick={(e) => excluirCategoria(cat, e)}>Remover</button>
                  </div>
                )}
              </div>

              {aberta && (
                <div className="transp-pasta-body">
                  {podeEditar && (
                    <button
                      type="button"
                      className="transp-add-mov-btn"
                      onClick={(e) => abrirCriarMovimento(cat.id, e)}
                    >
                      + Novo registro
                    </button>
                  )}

                  {(cat.movimentos || []).length === 0 && (
                    <p className="transp-pasta-vazio">Nenhum registro nesta categoria.</p>
                  )}

                  {(cat.movimentos || []).map((mov) => (
                    <div key={mov.id} className="transp-movimento">
                      <span className="transp-mov-data">{formatarData(mov.data)}</span>
                      <span className="transp-mov-desc">{mov.descricao}</span>
                      <span className={`transp-mov-valor ${tipo}`}>{formatarMoeda(mov.valor)}</span>
                      <div className="transp-mov-acoes">
                        {mov.comprovante && (
                          <a
                            href={getMediaURL(mov.comprovante)}
                            target="_blank"
                            rel="noreferrer"
                            className="transp-mov-comprovante"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Comprovante
                          </a>
                        )}
                        {podeEditar && (
                          <>
                            <button type="button" onClick={(e) => abrirEditarMovimento(mov, e)}>Editar</button>
                            <button type="button" className="danger" onClick={(e) => excluirMovimento(mov, e)}>Excluir</button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {podeEditar && (
          <button
            type="button"
            className="transp-add-cat-btn"
            onClick={() => abrirCriarCategoria(tipo)}
          >
            + Nova categoria de {tipo === "entrada" ? "entrada" : "saída"}
          </button>
        )}

        {lista.length === 0 && !podeEditar && (
          <p className="transp-grupo-vazio">Nenhuma categoria cadastrada.</p>
        )}
      </div>
    );
  }

  return (
    <div className="transp-page">
      <section className="transp-hero">
        <div className="transp-hero-inner">
          <span className="transp-hero-tag">Transparência</span>
          <h1>Cada centavo importa. E você merece saber onde vai.</h1>
          <p>
            A ACAPRA existe porque pessoas como você escolhem acreditar que animais
            merecem uma chance. Por isso, abrimos nossas contas, nossos documentos
            e nossos números para que você veja, com clareza, o caminho da sua doação:
            da sua mão à tigela de ração, à cirurgia que salvou uma vida, ao lar
            que adotou com amor.
          </p>
          <p>
            Agimos com responsabilidade contábil e com o coração aberto. Consulte,
            questione e fiscalize — isso nos torna mais fortes.
          </p>
        </div>
      </section>

      <div className="transp-content">
        <section className="transp-impacto" aria-labelledby="impacto-titulo">
          <h2 id="impacto-titulo" className="transp-section-title">Nosso impacto</h2>
          <p className="transp-section-sub">Números atualizados pela equipe da ACAPRA</p>
          <div className="transp-metricas">
            {metricas.map((m) => (
              <article key={m.rotulo} className="transp-metrica-card">
                <span className="transp-metrica-valor">{m.valor}</span>
                <strong className="transp-metrica-rotulo">{m.rotulo}</strong>
                <p className="transp-metrica-desc">{m.descricao}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="transp-dimensao" aria-labelledby="financeiro-titulo">
          <div className="transp-dimensao-header">
            <div>
              <h2 id="financeiro-titulo">Financeiro</h2>
              <p>Entradas e saídas organizadas por categoria</p>
            </div>
          </div>

          {loading && <p className="transp-estado">Carregando dados financeiros...</p>}
          {!loading && erro && <p className="transp-estado erro">Não foi possível carregar os dados financeiros.</p>}

          {!loading && !erro && (
            <div className="transp-financeiro">
              {renderGrupo("entrada", entradas)}
              {renderGrupo("saida", saidas)}
            </div>
          )}
        </section>

        <section className="transp-dimensao" aria-labelledby="institucional-titulo">
          <div className="transp-dimensao-header">
            <div>
              <h2 id="institucional-titulo">Documentos Institucionais</h2>
              <p>Comprove nossa legalidade e governança</p>
            </div>
          </div>
          <div className="transp-doc-lista">
            {documentosInstitucionais.map((doc) => (
              <CardDocumento key={doc.nome} nome={doc.nome} descricao={doc.descricao} />
            ))}
          </div>
        </section>

        <section className="transp-dimensao" aria-labelledby="parceiros-titulo">
          <div className="transp-dimensao-header">
            <div>
              <h2 id="parceiros-titulo">Parcerias</h2>
              <p>Quem nos ajuda a cuidar dos animais de São Joaquim</p>
            </div>
          </div>
          <div className="transp-parceiros-grid">
            {parceiros.map((p) => (
              <article key={p.nome} className="transp-parceiro-card">
                <strong>{p.nome}</strong>
                <p>{p.descricao}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="transp-cta">
          <h2>Dúvidas ou sugestões?</h2>
          <p>
            Entre em contato conosco. Queremos ser cada vez mais transparentes
            e sua opinião nos ajuda a melhorar.
          </p>
          <a href="mailto:acapra@email.com" className="transp-cta-link">Falar com a ACAPRA</a>
        </section>
      </div>

      {modalCat.aberto && podeEditar && (
        <div className="transp-modal-backdrop" onClick={fecharModalCat}>
          <div className="transp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="transp-modal-header">
              <h2>{modalCat.modo === "criar" ? "Nova categoria" : "Editar categoria"}</h2>
              <button type="button" className="transp-modal-close" onClick={fecharModalCat}>Fechar</button>
            </div>
            <form className="transp-form" onSubmit={salvarCategoria}>
              <label>
                Nome
                <input
                  value={formCat.nome}
                  onChange={(e) => setFormCat({ ...formCat, nome: e.target.value })}
                  required
                  maxLength={100}
                />
              </label>
              <label>
                Tipo
                <select value={formCat.tipo} onChange={(e) => setFormCat({ ...formCat, tipo: e.target.value })}>
                  <option value="entrada">Entrada</option>
                  <option value="saida">Saída</option>
                </select>
              </label>
              {modalCat.modo === "editar" && (
                <label>
                  Status
                  <select
                    value={formCat.ativo ? "true" : "false"}
                    onChange={(e) => setFormCat({ ...formCat, ativo: e.target.value === "true" })}
                  >
                    <option value="true">Ativo</option>
                    <option value="false">Inativo</option>
                  </select>
                </label>
              )}
              {erroCat && <p className="transp-form-erro">{erroCat}</p>}
              <div className="transp-modal-footer">
                <button type="button" className="secondary" onClick={fecharModalCat}>Cancelar</button>
                <button type="submit" disabled={salvandoCat}>{salvandoCat ? "Salvando..." : "Salvar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalMov.aberto && podeEditar && (
        <div className="transp-modal-backdrop" onClick={fecharModalMov}>
          <div className="transp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="transp-modal-header">
              <h2>{modalMov.modo === "criar" ? "Novo registro" : "Editar registro"}</h2>
              <button type="button" className="transp-modal-close" onClick={fecharModalMov}>Fechar</button>
            </div>
            <form className="transp-form" onSubmit={salvarMovimento}>
              <label>
                Categoria
                <select
                  value={formMov.categoria}
                  onChange={(e) => setFormMov({ ...formMov, categoria: e.target.value })}
                  required
                >
                  <option value="">Selecione...</option>
                  {categorias.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.tipo_display} — {cat.nome}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Descrição
                <input
                  value={formMov.descricao}
                  onChange={(e) => setFormMov({ ...formMov, descricao: e.target.value })}
                  required
                  maxLength={300}
                />
              </label>
              <div className="transp-form-row">
                <label>
                  Valor (R$)
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formMov.valor}
                    onChange={(e) => setFormMov({ ...formMov, valor: e.target.value })}
                    required
                  />
                </label>
                <label>
                  Data
                  <input
                    type="date"
                    value={formMov.data}
                    onChange={(e) => setFormMov({ ...formMov, data: e.target.value })}
                    required
                  />
                </label>
              </div>
              <label>
                Comprovante (imagem ou PDF)
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    setComprovanteFile(e.target.files?.[0] || null);
                    setRemoverComprovante(false);
                  }}
                />
              </label>
              {modalMov.dados?.comprovante && !comprovanteFile && (
                <label className="transp-form-check">
                  <input
                    type="checkbox"
                    checked={removerComprovante}
                    onChange={(e) => setRemoverComprovante(e.target.checked)}
                  />
                  Remover comprovante atual
                </label>
              )}
              {modalMov.modo === "editar" && (
                <label>
                  Status
                  <select
                    value={formMov.ativo ? "true" : "false"}
                    onChange={(e) => setFormMov({ ...formMov, ativo: e.target.value === "true" })}
                  >
                    <option value="true">Ativo</option>
                    <option value="false">Inativo</option>
                  </select>
                </label>
              )}
              {erroMov && <p className="transp-form-erro">{erroMov}</p>}
              <div className="transp-modal-footer">
                <button type="button" className="secondary" onClick={fecharModalMov}>Cancelar</button>
                <button type="submit" disabled={salvandoMov}>{salvandoMov ? "Salvando..." : "Salvar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Transparencia;
