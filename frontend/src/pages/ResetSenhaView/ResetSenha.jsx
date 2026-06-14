import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../../services/api";
import "./ResetSenha.css";

function ResetSenha() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [form, setForm] = useState({ new_password: "", confirmar: "" });
  const [erro, setErro] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate("/esqueci-senha", { replace: true });
    }
  }, [token, navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro(null);

    if (form.new_password !== form.confirmar) {
      setErro("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/api/gerenciamento/auth/password-reset/confirm/", {
        token,
        new_password: form.new_password,
      });
      navigate("/login", {
        state: { sucesso: "Senha redefinida com sucesso! Faça login com sua nova senha." },
        replace: true,
      });
    } catch (err) {
      const data = err.response?.data;
      if (data?.token) {
        const msg = Array.isArray(data.token) ? data.token[0] : data.token;
        setErro(msg);
      } else if (data?.new_password) {
        const msg = Array.isArray(data.new_password)
          ? data.new_password.join(" ")
          : data.new_password;
        setErro(msg);
      } else if (data && typeof data === "object") {
        setErro(Object.values(data).flat().join(" "));
      } else {
        setErro("Erro ao redefinir senha. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!token) return null;

  return (
    <div className="reset-container">
      <div className="reset-imagem">
        <img src="/cachorro.png" alt="Cachorro ACAPRA" />
        <div className="reset-imagem-overlay">
          <h2>Proteja quem não tem voz</h2>
        </div>
      </div>

      <div className="reset-card">
        <div className="reset-header">
          <img src="/logo.png" alt="Logo ACAPRA" className="reset-logo" />
          <h1>Nova senha</h1>
          <p>
            Crie uma senha forte para a sua conta <strong>Acapra</strong>.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="reset-form">
          <div className="reset-field">
            <label htmlFor="new_password">Nova senha</label>
            <input
              id="new_password"
              name="new_password"
              type="password"
              placeholder="Crie uma senha segura"
              value={form.new_password}
              onChange={handleChange}
              required
              autoFocus
            />
          </div>

          <div className="reset-field">
            <label htmlFor="confirmar">Confirmar senha</label>
            <input
              id="confirmar"
              name="confirmar"
              type="password"
              placeholder="Repita a nova senha"
              value={form.confirmar}
              onChange={handleChange}
              required
            />
          </div>

          {erro && <p className="reset-erro">{erro}</p>}

          <button type="submit" className="reset-btn" disabled={loading}>
            {loading ? "Salvando..." : "Redefinir senha"}
          </button>
        </form>

        <p className="reset-voltar">
          <Link to="/login">Voltar para o login</Link>
        </p>
      </div>
    </div>
  );
}

export default ResetSenha;
