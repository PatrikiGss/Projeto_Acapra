import { useCallback, useEffect, useState } from "react";
import api from "../../services/api";
import { useAdminAccess } from "../../hooks/useAdminAccess";
import { formatBrazilianPhone, toBrazilianPhoneE164 } from "../../utils/phone";
import "./Voluntariado.css";

const initialForm = {
  nome: "",
  telefone: "",
  idade: "",
  email: "",
  motivo: "",
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
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [voluntarios, setVoluntarios] = useState([]);
  const [loadingLista, setLoadingLista] = useState(false);
  const [erroLista, setErroLista] = useState("");

  const carregarVoluntarios = useCallback(() => {
    if (!podeEditar) return;

    setLoadingLista(true);
    setErroLista("");

    api
      .get("/api/voluntariado/voluntarios/")
      .then((response) => {
        setVoluntarios(response.data || []);
      })
      .catch((erro) => {
        console.error(erro);
        setErroLista("Não foi possível carregar os voluntários cadastrados.");
      })
      .finally(() => setLoadingLista(false));
  }, [podeEditar]);

  useEffect(() => {
    if (!podeEditar) return;

    api
      .get("/api/voluntariado/voluntarios/")
      .then((response) => {
        setVoluntarios(response.data || []);
      })
      .catch((erro) => {
        console.error(erro);
        setErroLista("Não foi possível carregar os voluntários cadastrados.");
      });
  }, [podeEditar]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: name === "telefone" ? formatBrazilianPhone(value) : value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setSending(true);
    setStatus("");
    setError("");

    const payload = {
      ...form,
      telefone: toBrazilianPhoneE164(form.telefone),
      idade: Number(form.idade),
      email: form.email || null,
    };

    api
      .post("/api/voluntariado/voluntarios/", payload)
      .then((response) => {
        setStatus(response.data.detail || "Cadastro enviado com sucesso.");
        setForm(initialForm);
        carregarVoluntarios();
      })
      .catch((erro) => {
        const data = erro.response?.data;
        const message =
          data?.detail ||
          "Não foi possível enviar o cadastro. Confira os dados e tente novamente.";
        setError(message);
        console.error(erro);
      })
      .finally(() => setSending(false));
  };

  const excluirVoluntario = async (voluntario) => {
    const confirmado = window.confirm(`Remover o cadastro de "${voluntario.nome}"?`);
    if (!confirmado) return;

    try {
      await api.delete(`/api/voluntariado/voluntarios/${voluntario.id}/`);
      setVoluntarios((lista) => lista.filter((item) => item.id !== voluntario.id));
    } catch (erro) {
      console.error(erro);
      alert("Não foi possível remover o cadastro.");
    }
  };

  return (
    <div className="voluntariado-page">
      <section className="voluntariado-content">
        <div className="voluntariado-heading">
          <h1>Faça parte</h1>
          <p>Preencha o formulário e seja um voluntário da ACAPRA</p>
        </div>

        <div className="voluntariado-layout">
          <form className="voluntariado-form" onSubmit={handleSubmit}>
            <label>
              Nome completo
              <input
                name="nome"
                type="text"
                value={form.nome}
                onChange={handleChange}
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
                Idade
                <input
                  name="idade"
                  type="number"
                  value={form.idade}
                  onChange={handleChange}
                  required
                  min="0"
                  max="150"
                />
              </label>
            </div>

            <label>
              Email
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Opcional"
              />
            </label>

            <label>
              Por que deseja ser voluntário?
              <textarea
                name="motivo"
                value={form.motivo}
                onChange={handleChange}
                required
                minLength="10"
                rows="5"
              />
            </label>

            {status && <p className="form-message success">{status}</p>}
            {error && <p className="form-message error">{error}</p>}

            <button type="submit" disabled={sending}>
              {sending ? "Enviando..." : "Enviar cadastro"}
            </button>
          </form>
        </div>

        {podeEditar && (
          <section className="voluntariado-admin">
            <div className="voluntariado-admin-header">
              <h2>Voluntários cadastrados</h2>
              <p>Lista de pessoas que se inscreveram pelo Faça Parte.</p>
            </div>

            {loadingLista && (
              <p className="voluntariado-admin-message">Carregando cadastros...</p>
            )}

            {!loadingLista && erroLista && (
              <p className="voluntariado-admin-message error">{erroLista}</p>
            )}

            {!loadingLista && !erroLista && voluntarios.length === 0 && (
              <p className="voluntariado-admin-message">
                Nenhum voluntário cadastrado até o momento.
              </p>
            )}

            {!loadingLista && !erroLista && voluntarios.length > 0 && (
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
                        onClick={() => excluirVoluntario(voluntario)}
                      >
                        Remover
                      </button>
                    </div>

                    <dl className="voluntariado-card-details">
                      <div>
                        <dt>Telefone</dt>
                        <dd>{voluntario.telefone}</dd>
                      </div>
                      <div>
                        <dt>Idade</dt>
                        <dd>{voluntario.idade} anos</dd>
                      </div>
                      {voluntario.email && (
                        <div>
                          <dt>E-mail</dt>
                          <dd>{voluntario.email}</dd>
                        </div>
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
          </section>
        )}
      </section>
    </div>
  );
}

export default Voluntariado;
