import { useCallback, useEffect, useState } from "react";
import api from "../../services/api";
import { useAdminAccess } from "../../hooks/useAdminAccess";
import { formatBrazilianPhone, toBrazilianPhoneE164 } from "../../utils/phone";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import EmptyState from "../../components/ui/EmptyState";
import ConfirmModal from "../../components/ui/ConfirmModal";
import { getResponseItems } from "../../utils/collection";
import { getApiErrorMessage, isNotFoundError } from "../../utils/errorUtils";
import "./Voluntariado.css";

const initialFormVoluntario = {
  nome: "",
  telefone: "",
  idade: "",
  email: "",
  motivo: "",
};

const initialFormLar = {
  nome_responsavel: "",
  telefone: "",
  email: "",
  cidade: "",
  tipos_animais: "todos",
  capacidade: "",
  descricao: "",
};

function formatarData(valor) {
  if (!valor) return "";
  const data = new Date(valor);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(data);
}

function Voluntariado() {
  const { podeEditar } = useAdminAccess("voluntariado");
  const [abaAtiva, setAbaAtiva] = useState("voluntario");

  // --- Voluntário ---
  const [formVoluntario, setFormVoluntario] = useState(initialFormVoluntario);
  const [statusVoluntario, setStatusVoluntario] = useState("");
  const [errorVoluntario, setErrorVoluntario] = useState("");
  const [sendingVoluntario, setSendingVoluntario] = useState(false);
  const [voluntarios, setVoluntarios] = useState([]);
  const [loadingVoluntarios, setLoadingVoluntarios] = useState(false);
  const [erroVoluntarios, setErroVoluntarios] = useState("");
  const [erroAcaoVoluntario, setErroAcaoVoluntario] = useState("");
  const [voluntarioParaExclusao, setVoluntarioParaExclusao] = useState(null);

  // --- Lar voluntário ---
  const [formLar, setFormLar] = useState(initialFormLar);
  const [statusLar, setStatusLar] = useState("");
  const [errorLar, setErrorLar] = useState("");
  const [sendingLar, setSendingLar] = useState(false);
  const [lares, setLares] = useState([]);
  const [loadingLares, setLoadingLares] = useState(false);
  const [erroLares, setErroLares] = useState("");
  const [erroAcaoLar, setErroAcaoLar] = useState("");
  const [larParaExclusao, setLarParaExclusao] = useState(null);

  // --- Carregar listas admin ---
  const carregarVoluntarios = useCallback(({ silencioso = false } = {}) => {
    if (!podeEditar) return;
    if (!silencioso) setLoadingVoluntarios(true);
    setErroVoluntarios("");
    api.get("/api/voluntariado/voluntarios/")
      .then((res) => setVoluntarios(getResponseItems(res.data)))
      .catch(() => setErroVoluntarios("Não foi possível carregar os voluntários."))
      .finally(() => {
        if (!silencioso) setLoadingVoluntarios(false);
      });
  }, [podeEditar]);

  const carregarLares = useCallback(({ silencioso = false } = {}) => {
    if (!podeEditar) return;
    if (!silencioso) setLoadingLares(true);
    setErroLares("");
    api.get("/api/lares/lares/")
      .then((res) => setLares(getResponseItems(res.data)))
      .catch(() => setErroLares("Não foi possível carregar os lares voluntários."))
      .finally(() => {
        if (!silencioso) setLoadingLares(false);
      });
  }, [podeEditar]);

  useEffect(() => {
    let ativo = true;
    if (!podeEditar) return;

    const carregar = async () => {
      setLoadingVoluntarios(true);
      try {
        const res = await api.get("/api/voluntariado/voluntarios/");
        if (ativo) setVoluntarios(getResponseItems(res.data));
      } catch {
        if (ativo) setErroVoluntarios("Não foi possível carregar os voluntários.");
      } finally {
        if (ativo) setLoadingVoluntarios(false);
      }
    };

    void carregar();
    return () => { ativo = false; };
  }, [podeEditar]);

  useEffect(() => {
    let ativo = true;
    if (!podeEditar) return;

    const carregar = async () => {
      setLoadingLares(true);
      try {
        const res = await api.get("/api/lares/lares/");
        if (ativo) setLares(getResponseItems(res.data));
      } catch {
        if (ativo) setErroLares("Não foi possível carregar os lares voluntários.");
      } finally {
        if (ativo) setLoadingLares(false);
      }
    };

    void carregar();
    return () => { ativo = false; };
  }, [podeEditar]);

  // --- Handlers voluntário ---
  const handleChangeVoluntario = (e) => {
    const { name, value } = e.target;
    setFormVoluntario((c) => ({
      ...c,
      [name]:
        name === "telefone"
          ? formatBrazilianPhone(value)
          : name === "idade"
            // Só dígitos e no máximo 3 (inputs number ignoram maxLength).
            ? value.replace(/\D/g, "").slice(0, 3)
            : value,
    }));
  };

  const handleSubmitVoluntario = (e) => {
    e.preventDefault();
    setSendingVoluntario(true);
    setStatusVoluntario("");
    setErrorVoluntario("");

    const payload = {
      ...formVoluntario,
      telefone: toBrazilianPhoneE164(formVoluntario.telefone),
      idade: Number(formVoluntario.idade),
      email: formVoluntario.email || null,
    };

    api.post("/api/voluntariado/voluntarios/", payload)
      .then((res) => {
        setStatusVoluntario(res.data.detail || "Cadastro enviado com sucesso.");
        setFormVoluntario(initialFormVoluntario);
        carregarVoluntarios();
      })
      .catch((err) => {
        setErrorVoluntario(
          err.response?.data?.detail ||
          "Não foi possível enviar o cadastro. Confira os dados e tente novamente."
        );
      })
      .finally(() => setSendingVoluntario(false));
  };

  const confirmarExclusaoVoluntario = async () => {
    if (!voluntarioParaExclusao) return;
    try {
      await api.delete(`/api/voluntariado/voluntarios/${voluntarioParaExclusao.id}/`);
    } catch (err) {
      // 404 = cadastro já não existe no servidor: trata como já removido.
      if (!isNotFoundError(err)) {
        setErroAcaoVoluntario(getApiErrorMessage(err, "Não foi possível remover o cadastro."));
        setVoluntarioParaExclusao(null);
        return;
      }
    }
    setVoluntarios((lista) => lista.filter((v) => v.id !== voluntarioParaExclusao.id));
    setVoluntarioParaExclusao(null);
    carregarVoluntarios({ silencioso: true });
  };

  // --- Handlers lar ---
  const handleChangeLar = (e) => {
    const { name, value } = e.target;
    setFormLar((c) => ({
      ...c,
      [name]: name === "telefone" ? formatBrazilianPhone(value) : value,
    }));
  };

  const handleSubmitLar = (e) => {
    e.preventDefault();
    setSendingLar(true);
    setStatusLar("");
    setErrorLar("");

    const payload = {
      ...formLar,
      telefone: toBrazilianPhoneE164(formLar.telefone),
      capacidade: Number(formLar.capacidade),
      email: formLar.email || null,
    };

    api.post("/api/lares/lares/", payload)
      .then((res) => {
        setStatusLar(res.data.detail || "Cadastro enviado com sucesso.");
        setFormLar(initialFormLar);
        carregarLares();
      })
      .catch((err) => {
        setErrorLar(
          err.response?.data?.detail ||
          "Não foi possível enviar o cadastro. Confira os dados e tente novamente."
        );
      })
      .finally(() => setSendingLar(false));
  };

  const confirmarExclusaoLar = async () => {
    if (!larParaExclusao) return;
    try {
      await api.delete(`/api/lares/lares/${larParaExclusao.id}/`);
    } catch (err) {
      // 404 = cadastro já não existe no servidor: trata como já removido.
      if (!isNotFoundError(err)) {
        setErroAcaoLar(getApiErrorMessage(err, "Não foi possível remover o cadastro."));
        setLarParaExclusao(null);
        return;
      }
    }
    setLares((lista) => lista.filter((l) => l.id !== larParaExclusao.id));
    setLarParaExclusao(null);
    carregarLares({ silencioso: true });
  };

  return (
    <div className="voluntariado-page">
      <section className="voluntariado-content">
        <div className="voluntariado-heading">
          <h1>Faça parte</h1>
          <p>Escolha como você quer ajudar a ACAPRA</p>
        </div>

        <div className="voluntariado-tabs">
          <button
            type="button"
            className={`voluntariado-tab ${abaAtiva === "voluntario" ? "active" : ""}`}
            onClick={() => setAbaAtiva("voluntario")}
          >
            Quero ser voluntário
          </button>
          <button
            type="button"
            className={`voluntariado-tab ${abaAtiva === "lar" ? "active" : ""}`}
            onClick={() => setAbaAtiva("lar")}
          >
            Quero ser lar temporário
          </button>
        </div>

        <div className="voluntariado-layout">
          {abaAtiva === "voluntario" && (
            <form className="voluntariado-form" onSubmit={handleSubmitVoluntario}>
              <label>
                Nome completo
                <input
                  name="nome"
                  type="text"
                  value={formVoluntario.nome}
                  onChange={handleChangeVoluntario}
                  required
                  maxLength="200"
                />
              </label>

              <div className="form-row">
                <label>
                  Telefone
                  <input
                    name="telefone"
                    type="tel"
                    value={formVoluntario.telefone}
                    onChange={handleChangeVoluntario}
                    required
                    inputMode="tel"
                    autoComplete="tel-national"
                    placeholder="(49) 99999-9999"
                    maxLength="15"
                  />
                </label>

                <label>
                  Idade
                  <input
                    name="idade"
                    type="number"
                    value={formVoluntario.idade}
                    onChange={handleChangeVoluntario}
                    required
                    min="0"
                    max="150"
                    maxLength={3}
                    inputMode="numeric"
                  />
                </label>
              </div>

              <label>
                Email
                <input
                  name="email"
                  type="email"
                  value={formVoluntario.email}
                  onChange={handleChangeVoluntario}
                  placeholder="Opcional"
                />
              </label>

              <label>
                Por que deseja ser voluntário?
                <textarea
                  name="motivo"
                  value={formVoluntario.motivo}
                  onChange={handleChangeVoluntario}
                  required
                  minLength="10"
                  rows="5"
                />
              </label>

              {statusVoluntario && <p className="form-message success">{statusVoluntario}</p>}
              {errorVoluntario && <p className="form-message error">{errorVoluntario}</p>}

              <button type="submit" disabled={sendingVoluntario}>
                {sendingVoluntario ? "Enviando..." : "Enviar cadastro"}
              </button>
            </form>
          )}

          {abaAtiva === "lar" && (
            <form className="voluntariado-form" onSubmit={handleSubmitLar}>
              <label>
                Nome do responsável
                <input
                  name="nome_responsavel"
                  type="text"
                  value={formLar.nome_responsavel}
                  onChange={handleChangeLar}
                  required
                  maxLength="200"
                />
              </label>

              <div className="form-row">
                <label>
                  Telefone
                  <input
                    name="telefone"
                    type="tel"
                    value={formLar.telefone}
                    onChange={handleChangeLar}
                    required
                    inputMode="tel"
                    autoComplete="tel-national"
                    placeholder="(49) 99999-9999"
                    maxLength="15"
                  />
                </label>

                <label>
                  Cidade
                  <input
                    name="cidade"
                    type="text"
                    value={formLar.cidade}
                    onChange={handleChangeLar}
                    required
                    maxLength="100"
                  />
                </label>
              </div>

              <label>
                Email
                <input
                  name="email"
                  type="email"
                  value={formLar.email}
                  onChange={handleChangeLar}
                  placeholder="Opcional"
                />
              </label>

              <div className="form-row">
                <label>
                  Animais aceitos
                  <select
                    name="tipos_animais"
                    value={formLar.tipos_animais}
                    onChange={handleChangeLar}
                    required
                  >
                    <option value="todos">Todos</option>
                    <option value="caes">Cães</option>
                    <option value="gatos">Gatos</option>
                    <option value="caes_gatos">Cães e Gatos</option>
                  </select>
                </label>

                <label>
                  Capacidade (nº de animais)
                  <input
                    name="capacidade"
                    type="number"
                    value={formLar.capacidade}
                    onChange={handleChangeLar}
                    required
                    min="1"
                    max="50"
                  />
                </label>
              </div>

              <label>
                Descreva seu lar
                <textarea
                  name="descricao"
                  value={formLar.descricao}
                  onChange={handleChangeLar}
                  required
                  minLength="20"
                  rows="5"
                  placeholder="Fale sobre o espaço disponível, experiência com animais, rotina da casa..."
                />
              </label>

              {statusLar && <p className="form-message success">{statusLar}</p>}
              {errorLar && <p className="form-message error">{errorLar}</p>}

              <button type="submit" disabled={sendingLar}>
                {sendingLar ? "Enviando..." : "Enviar cadastro"}
              </button>
            </form>
          )}
        </div>

        {podeEditar && (
          <>
            <section className="voluntariado-admin">
              <div className="voluntariado-admin-header">
                <h2>Voluntários cadastrados</h2>
                <p>Lista de pessoas que se inscreveram pelo Faça Parte.</p>
              </div>

              {loadingVoluntarios && <LoadingSpinner label="Carregando cadastros..." />}

              {!loadingVoluntarios && erroVoluntarios && (
                <EmptyState title="Não foi possível carregar os cadastros." description={erroVoluntarios} />
              )}

              {!loadingVoluntarios && !erroVoluntarios && voluntarios.length === 0 && (
                <EmptyState
                  title="Nenhum voluntário cadastrado até o momento."
                  description="Os cadastros enviados aparecerão aqui."
                />
              )}

              {!loadingVoluntarios && !erroVoluntarios && voluntarios.length > 0 && (
                <div className="voluntariado-admin-list">
                  {voluntarios.map((voluntario) => (
                    <article className="voluntariado-card" key={voluntario.id}>
                      <div className="voluntariado-card-header">
                        <div>
                          <h3>{voluntario.nome}</h3>
                          <p>{formatarData(voluntario.created_at)}</p>
                        </div>
                        <button
                          type="button"
                          className="voluntariado-delete-button"
                          onClick={() => setVoluntarioParaExclusao(voluntario)}
                        >
                          Remover
                        </button>
                      </div>

                      <dl className="voluntariado-card-details">
                        <div><dt>Telefone</dt><dd>{voluntario.telefone}</dd></div>
                        <div><dt>Idade</dt><dd>{voluntario.idade} anos</dd></div>
                        {voluntario.email && (
                          <div><dt>E-mail</dt><dd>{voluntario.email}</dd></div>
                        )}
                      </dl>

                      <div className="voluntariado-card-motivo">
                        <span>Motivo</span>
                        <p>{voluntario.motivo}</p>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {erroAcaoVoluntario && (
                <p className="voluntariado-admin-message error">{erroAcaoVoluntario}</p>
              )}

              <ConfirmModal
                open={Boolean(voluntarioParaExclusao)}
                title="Remover cadastro"
                message={`Tem certeza que deseja remover "${voluntarioParaExclusao?.nome || ""}"?`}
                confirmLabel="Remover"
                onClose={() => setVoluntarioParaExclusao(null)}
                onConfirm={confirmarExclusaoVoluntario}
              />
            </section>

            <section className="voluntariado-admin">
              <div className="voluntariado-admin-header">
                <h2>Lares temporários cadastrados</h2>
                <p>Lista de lares que se inscreveram para acolher animais.</p>
              </div>

              {loadingLares && <LoadingSpinner label="Carregando lares..." />}

              {!loadingLares && erroLares && (
                <EmptyState title="Não foi possível carregar os lares." description={erroLares} />
              )}

              {!loadingLares && !erroLares && lares.length === 0 && (
                <EmptyState
                  title="Nenhum lar cadastrado até o momento."
                  description="Os cadastros enviados aparecerão aqui."
                />
              )}

              {!loadingLares && !erroLares && lares.length > 0 && (
                <div className="voluntariado-admin-list">
                  {lares.map((lar) => (
                    <article className="voluntariado-card" key={lar.id}>
                      <div className="voluntariado-card-header">
                        <div>
                          <h3>{lar.nome_responsavel}</h3>
                          <p>{formatarData(lar.created_at)}</p>
                        </div>
                        <button
                          type="button"
                          className="voluntariado-delete-button"
                          onClick={() => setLarParaExclusao(lar)}
                        >
                          Remover
                        </button>
                      </div>

                      <dl className="voluntariado-card-details">
                        <div><dt>Telefone</dt><dd>{lar.telefone}</dd></div>
                        <div><dt>Cidade</dt><dd>{lar.cidade}</dd></div>
                        <div><dt>Animais aceitos</dt><dd>{lar.tipos_animais_display}</dd></div>
                        <div><dt>Capacidade</dt><dd>{lar.capacidade} animal(is)</dd></div>
                        {lar.email && (
                          <div><dt>E-mail</dt><dd>{lar.email}</dd></div>
                        )}
                      </dl>

                      <div className="voluntariado-card-motivo">
                        <span>Descrição do lar</span>
                        <p>{lar.descricao}</p>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {erroAcaoLar && (
                <p className="voluntariado-admin-message error">{erroAcaoLar}</p>
              )}

              <ConfirmModal
                open={Boolean(larParaExclusao)}
                title="Remover lar"
                message={`Tem certeza que deseja remover o lar de "${larParaExclusao?.nome_responsavel || ""}"?`}
                confirmLabel="Remover"
                onClose={() => setLarParaExclusao(null)}
                onConfirm={confirmarExclusaoLar}
              />
            </section>
          </>
        )}
      </section>
    </div>
  );
}

export default Voluntariado;
