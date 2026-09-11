import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import "./EsqueciSenha.css";

function EsqueciSenha() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro(null);
    setLoading(true);
    try {
      await api.post("/api/gerenciamento/auth/password-reset/request/", { email });
      setEnviado(true);
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === "object") {
        const mensagens = Object.values(data).flat().join(" ");
        setErro(mensagens);
      } else {
        setErro("Erro ao processar. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="esqueci-container">
      <div className="esqueci-imagem">
        <img src="/cachorro.webp" alt="Cachorro ACAPRA" />
        <div className="esqueci-imagem-overlay">
          <h2>Proteja quem não tem voz</h2>
        </div>
      </div>

      <div className="esqueci-card">
        <div className="esqueci-header">
          <img src="/logo.png" alt="Logo ACAPRA" className="esqueci-logo" />
          <h1>Esqueceu a senha?</h1>
          <p>
            Informe seu e-mail e enviaremos um link para redefinir sua senha.
          </p>
        </div>

        {enviado ? (
          <div className="esqueci-sucesso">
            <p>
              Se o e-mail estiver cadastrado, você receberá um link em breve.
              Verifique também a pasta de spam.
            </p>
            <Link to="/login" className="esqueci-btn">
              Voltar para o login
            </Link>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="esqueci-form">
              <div className="esqueci-field">
                <label htmlFor="email">E-mail</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              {erro && <p className="esqueci-erro">{erro}</p>}

              <button type="submit" className="esqueci-btn" disabled={loading}>
                {loading ? "Enviando..." : "Enviar link"}
              </button>
            </form>

            <p className="esqueci-voltar">
              Lembrou a senha? <Link to="/login">Entrar</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default EsqueciSenha;
