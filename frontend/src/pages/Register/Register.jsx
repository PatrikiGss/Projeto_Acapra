import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../services/api";
import "./Register.css";

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ nome: "", email: "", telefone: "", password: "" });
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erro, setErro] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro(null);

    if (form.password !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    try {
    await api.post("/api/gerenciamento/auth/register/", form);

      navigate("/login");
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === "object") {
        const mensagens = Object.values(data).flat().join(" ");
        setErro(mensagens);
      } else {
        setErro("Erro ao cadastrar. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-imagem">
        <img src="/cachorro.png" alt="Cachorro Acapra" />
        <div className="register-imagem-overlay">
          <h2>Proteja quem não tem voz</h2>
        </div>
      </div>

      <div className="register-card">
        <div className="register-header">
          <span className="register-logo">🐾</span>
          <h1>Criar Conta</h1>
          <p>Faça parte da <strong>Acapra</strong> e ajude a proteger os animais</p>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          <div className="register-field">
            <label htmlFor="nome">Nome completo</label>
            <input
              id="nome"
              name="nome"
              type="text"
              placeholder="Seu nome"
              value={form.nome}
              onChange={handleChange}
              required
            />
          </div>

          <div className="register-field">
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

          <div className="register-field">
            <label htmlFor="telefone">Telefone</label>
            <input
              id="telefone"
              name="telefone"
              type="text"
              placeholder="+5501234567890"
              value={form.telefone}
              onChange={handleChange}
              required
            />
          </div>

          <div className="register-field">
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Crie uma senha segura"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="register-field">
            <label htmlFor="confirmarSenha">Confirmar senha</label>
            <input
              id="confirmarSenha"
              name="confirmarSenha"
              type="password"
              placeholder="Repita a senha"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              required
            />
          </div>

          {erro && <p className="register-erro">{erro}</p>}

          <button type="submit" className="register-btn" disabled={loading}>
            {loading ? "Cadastrando..." : "Cadastrar"}
          </button>
        </form>

        <p className="register-login">
          Já tem uma conta? <Link to="/login">Entrar</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
