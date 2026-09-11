import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { clearAuthSession, getStoredUser, isLoggedIn, setAuthSession } from "../../utils/auth";
import { formatBrazilianPhone, toBrazilianPhoneE164 } from "../../utils/phone";
import "./Perfil.css";

function Perfil() {
  const navigate = useNavigate();

  const [usuario, setUsuario] = useState(getStoredUser());
  const [carregando, setCarregando] = useState(true);

  const [dadosForm, setDadosForm] = useState({ nome: "", telefone: "" });
  const [dadosErro, setDadosErro] = useState(null);
  const [dadosSucesso, setDadosSucesso] = useState(false);
  const [dadosLoading, setDadosLoading] = useState(false);

  const [logoutLoading, setLogoutLoading] = useState(false);

  const [senhaForm, setSenhaForm] = useState({ old_password: "", new_password: "", confirmar: "" });
  const [senhaErro, setSenhaErro] = useState(null);
  const [senhaSucesso, setSenhaSucesso] = useState(false);
  const [senhaLoading, setSenhaLoading] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate("/login", { state: { from: "/perfil" }, replace: true });
      return;
    }

    api.get("/api/gerenciamento/user/me/")
      .then((res) => {
        setUsuario(res.data);
        setDadosForm({ nome: res.data.nome || "", telefone: res.data.telefone || "" });
      })
      .catch(() => {
        const armazenado = getStoredUser();
        if (armazenado) {
          setUsuario(armazenado);
          setDadosForm({ nome: armazenado.nome || "", telefone: armazenado.telefone || "" });
        }
      })
      .finally(() => setCarregando(false));
  }, [navigate]);

  const handleDadosChange = (e) => {
    const { name, value } = e.target;
    setDadosForm({ ...dadosForm, [name]: name === "telefone" ? formatBrazilianPhone(value) : value });
    setDadosErro(null);
    setDadosSucesso(false);
  };

  const handleDadosSubmit = async (e) => {
    e.preventDefault();
    setDadosErro(null);
    setDadosSucesso(false);
    setDadosLoading(true);

    try {
      const res = await api.patch("/api/gerenciamento/user/me/", {
        ...dadosForm,
        telefone: toBrazilianPhoneE164(dadosForm.telefone),
      });
      setUsuario(res.data);
      setAuthSession({ user: res.data });
      setDadosSucesso(true);
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === "object") {
        setDadosErro(Object.values(data).flat().join(" "));
      } else {
        setDadosErro("Erro ao salvar. Tente novamente.");
      }
    } finally {
      setDadosLoading(false);
    }
  };

  const handleSenhaChange = (e) => {
    setSenhaForm({ ...senhaForm, [e.target.name]: e.target.value });
    setSenhaErro(null);
    setSenhaSucesso(false);
  };

  const handleSenhaSubmit = async (e) => {
    e.preventDefault();
    setSenhaErro(null);
    setSenhaSucesso(false);

    if (senhaForm.new_password !== senhaForm.confirmar) {
      setSenhaErro("As senhas não coincidem.");
      return;
    }

    setSenhaLoading(true);
    try {
      await api.post("/api/gerenciamento/user/change-password/", {
        old_password: senhaForm.old_password,
        new_password: senhaForm.new_password,
      });
      setSenhaSucesso(true);
      setSenhaForm({ old_password: "", new_password: "", confirmar: "" });
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === "object") {
        setSenhaErro(Object.values(data).flat().join(" "));
      } else {
        setSenhaErro("Erro ao alterar senha. Tente novamente.");
      }
    } finally {
      setSenhaLoading(false);
    }
  };

  const handleLogout = async () => {
    const refresh = localStorage.getItem("refresh");
    setLogoutLoading(true);
    try {
      if (refresh) {
        await api.post("/api/gerenciamento/auth/logout/", { refresh });
      }
    } catch {
      // falha remota: limpa sessão local de qualquer forma
    } finally {
      clearAuthSession();
      navigate("/login");
    }
  };

  if (carregando) {
    return (
      <div className="perfil-loading">
        <p>Carregando perfil...</p>
      </div>
    );
  }

  return (
    <div className="perfil-page">
      <div className="perfil-container">
        <div className="perfil-header">
          <div className="perfil-avatar">
            {(usuario?.nome || usuario?.email || "U")[0].toUpperCase()}
          </div>
          <div>
            <h1 className="perfil-nome">{usuario?.nome || "Usuário"}</h1>
            <p className="perfil-email">{usuario?.email}</p>
          </div>
        </div>

        <div className="perfil-cards">
          <section className="perfil-card">
            <h2 className="perfil-card-titulo">Meus dados</h2>

            <form onSubmit={handleDadosSubmit} className="perfil-form">
              <div className="perfil-field">
                <label htmlFor="email-readonly">E-mail</label>
                <input
                  id="email-readonly"
                  type="email"
                  value={usuario?.email || ""}
                  disabled
                  className="perfil-input-disabled"
                />
              </div>

              <div className="perfil-field">
                <label htmlFor="nome">Nome</label>
                <input
                  id="nome"
                  name="nome"
                  type="text"
                  placeholder="Seu nome completo"
                  value={dadosForm.nome}
                  onChange={handleDadosChange}
                  required
                />
              </div>

              <div className="perfil-field">
                <label htmlFor="telefone">Telefone</label>
                <input
                  id="telefone"
                  name="telefone"
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={dadosForm.telefone}
                  onChange={handleDadosChange}
                />
              </div>

              {dadosErro && <p className="perfil-erro">{dadosErro}</p>}
              {dadosSucesso && <p className="perfil-sucesso">Dados atualizados com sucesso!</p>}

              <button type="submit" className="perfil-btn" disabled={dadosLoading}>
                {dadosLoading ? "Salvando..." : "Salvar alterações"}
              </button>
            </form>
          </section>

          <section className="perfil-card">
            <h2 className="perfil-card-titulo">Alterar senha</h2>

            <form onSubmit={handleSenhaSubmit} className="perfil-form">
              <div className="perfil-field">
                <label htmlFor="old_password">Senha atual</label>
                <input
                  id="old_password"
                  name="old_password"
                  type="password"
                  placeholder="Sua senha atual"
                  value={senhaForm.old_password}
                  onChange={handleSenhaChange}
                  required
                />
              </div>

              <div className="perfil-field">
                <label htmlFor="new_password">Nova senha</label>
                <input
                  id="new_password"
                  name="new_password"
                  type="password"
                  placeholder="Crie uma senha segura"
                  value={senhaForm.new_password}
                  onChange={handleSenhaChange}
                  required
                />
              </div>

              <div className="perfil-field">
                <label htmlFor="confirmar">Confirmar nova senha</label>
                <input
                  id="confirmar"
                  name="confirmar"
                  type="password"
                  placeholder="Repita a nova senha"
                  value={senhaForm.confirmar}
                  onChange={handleSenhaChange}
                  required
                />
              </div>

              {senhaErro && <p className="perfil-erro">{senhaErro}</p>}
              {senhaSucesso && <p className="perfil-sucesso">Senha alterada com sucesso!</p>}

              <button type="submit" className="perfil-btn" disabled={senhaLoading}>
                {senhaLoading ? "Alterando..." : "Alterar senha"}
              </button>
            </form>
          </section>
        </div>

        <div className="perfil-logout-area">
          <button
            type="button"
            className="perfil-btn-logout"
            onClick={handleLogout}
            disabled={logoutLoading}
          >
            {logoutLoading ? "Saindo..." : "Sair da conta"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Perfil;
