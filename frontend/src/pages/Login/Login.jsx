import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../services/api";
import "./Login.css";

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [erro, setErro] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro(null);
    setLoading(true);
    try {
      const response = await api.post("/api/gerenciamento/auth/login/", form);
      localStorage.setItem("access", response.data.access);
      localStorage.setItem("refresh", response.data.refresh);
      navigate("/");
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

  return (
    <div className="login-container">
      <div className="login-imagem">
        <img src="/cachorro.png" alt="Cachorro Acapra" />
        <div className="login-imagem-overlay">
          <h2>Proteja quem não tem voz</h2>
        </div>
      </div>

      <div className="login-card">
        <div className="login-header">
          <span className="login-logo">🐾</span>
          <h1>Entrar</h1>
          <p>Acesse sua conta na <strong>Acapra</strong></p>
        </div>

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
              required
            />
          </div>

          {erro && <p className="login-erro">{erro}</p>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="login-register">
          Não tem uma conta? <Link to="/register">Cadastrar</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
