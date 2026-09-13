import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import api from "../../services/api";
import {
  getStoredUser,
  isLoggedIn,
  setAuthSession,
  subscribeToAuthChanges,
} from "../../utils/auth";
import { safeInternalPath } from "../../utils/url";
import "./Login.css";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  // Garante redirecionamento apenas para rotas internas (anti open-redirect).
  const from = safeInternalPath(location.state?.from, "/");
  const [form, setForm] = useState({ email: "", password: "" });
  const [erro, setErro] = useState(null);
  const [loading, setLoading] = useState(false);
  const sucesso = location.state?.sucesso ?? null;
  const [estaLogado, setEstaLogado] = useState(isLoggedIn());
  const [usuario, setUsuario] = useState(getStoredUser());
  const [carregandoUsuario, setCarregandoUsuario] = useState(false);

  useEffect(() => {
    const sincronizarAuth = async () => {
      const logado = isLoggedIn();
      setEstaLogado(logado);

      if (!logado) {
        setUsuario(null);
        return;
      }

      const armazenado = getStoredUser();
      if (armazenado) {
        setUsuario(armazenado);
      }

      setCarregandoUsuario(true);
      try {
        const response = await api.get("/api/gerenciamento/user/me/");
        setUsuario(response.data);
      } catch {
        setUsuario(armazenado);
      } finally {
        setCarregandoUsuario(false);
      }
    };

    sincronizarAuth();
    return subscribeToAuthChanges(sincronizarAuth);
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const carregarPerfil = async () => {
    try {
      const response = await api.get("/api/gerenciamento/user/me/");
      setAuthSession({
        access: localStorage.getItem("access"),
        refresh: localStorage.getItem("refresh"),
        user: response.data,
      });
      setUsuario(response.data);
    } catch {
      setUsuario(getStoredUser());
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro(null);
    setLoading(true);
    try {
      const response = await api.post("/api/gerenciamento/auth/login/", form);
      setAuthSession({
        access: response.data.access,
        refresh: response.data.refresh,
      });
      await carregarPerfil();
      setForm({ email: "", password: "" });
      navigate(from, { replace: true });
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === "object") {
        const mensagens = Object.values(data).flat().join(" ");
        setErro(mensagens);
      } else {
        setErro("E-mail ou senha inválidos.");
      }
    } finally {
      setLoading(false);
    }
  };

  const nomeUsuario = usuario?.nome || usuario?.email || "Usuário";

  return (
    <div className="login-container">
      <div className="login-imagem">
        <img src="/cachorro.webp" alt="Cachorro ACAPRA" />
        <div className="login-imagem-overlay">
          <h2>Proteja quem não tem voz</h2>
        </div>
      </div>

      <div className="login-card">
        <div className="login-header">
          <span className="login-logo">
            <img src="/logo.png" alt="Logo ACAPRA" className="login-logo" />
          </span>
          {estaLogado ? <h1>Usuário</h1> : <h1>Entrar</h1>}
          <p>
            {estaLogado ? (
              <>
                Você está conectado como <strong>{nomeUsuario}</strong>
              </>
            ) : (
              <>
                Acesse sua conta na <strong>Acapra</strong>
              </>
            )}
          </p>
        </div>

        {estaLogado ? (
          <div className="login-profile">
            <div className="login-profile-card">
              {carregandoUsuario ? (
                <p className="login-profile-loading">Carregando seus dados...</p>
              ) : (
                <>
                  <div className="login-profile-row">
                    <span>Nome</span>
                    <strong>{usuario?.nome || "Não informado"}</strong>
                  </div>
                  <div className="login-profile-row">
                    <span>E-mail</span>
                    <strong>{usuario?.email || "Não informado"}</strong>
                  </div>
                  <div className="login-profile-row">
                    <span>Telefone</span>
                    <strong>{usuario?.telefone || "Não informado"}</strong>
                  </div>
                </>
              )}
            </div>

            <div className="login-profile-actions">
              <button type="button" className="login-btn secondary" onClick={() => navigate("/")}>
                Ir para início
              </button>
              <button type="button" className="login-btn" onClick={() => navigate("/perfil")}>
                Meu perfil
              </button>
            </div>
          </div>
        ) : (
          <>
            {sucesso && <p className="login-sucesso">{sucesso}</p>}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="login-field">
                <label htmlFor="email">E-mail</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="login-field">
                <label htmlFor="password">Senha</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Sua senha"
                  value={form.password}
                  onChange={handleChange}
                  maxLength={128}
                  required
                />
              </div>

              <div className="login-esqueceu">
                <Link to="/esqueci-senha">Esqueceu sua senha?</Link>
              </div>

              {erro && <p className="login-erro">{erro}</p>}

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? "Entrando..." : "Entrar"}
              </button>
            </form>

            <p className="login-register">
              Não tem uma conta? <Link to="/register">Cadastrar</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default Login;

