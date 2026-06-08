import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { clearAuthSession, getStoredUser, isLoggedIn, subscribeToAuthChanges } from "../../utils/auth";
import { temAcessoDashboard } from "../../utils/permissions";
import "./header.css";

function Header() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [newsOpen, setNewsOpen] = useState(false);
  const [estaLogado, setEstaLogado] = useState(isLoggedIn());
  const [usuario, setUsuario] = useState(getStoredUser());

  const closeMenu = () => {
    setMenuOpen(false);
    setNewsOpen(false);
  };

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

      try {
        const response = await api.get("/api/gerenciamento/user/me/");
        setUsuario(response.data);
      } catch {
        setUsuario(armazenado);
      }
    };

    sincronizarAuth();
    return subscribeToAuthChanges(sincronizarAuth);
  }, []);

  const nomeExibicao = useMemo(() => {
    if (!usuario) return "Usuário";
    return usuario.nome || usuario.email || "Usuário";
  }, [usuario]);

  const toggleNoticias = () => {
    setNewsOpen((current) => !current);
  };

  const handleLogout = async () => {
    const refresh = localStorage.getItem("refresh");

    try {
      if (refresh) {
        await api.post("/api/gerenciamento/auth/logout/", { refresh });
      }
    } catch {
      // Mesmo se o logout remoto falhar, limpamos a sessão local.
    } finally {
      clearAuthSession();
      closeMenu();
      navigate("/");
    }
  };

  return (
    <header className="site-header">
      <Link className="site-brand" to="/" onClick={closeMenu}>
        <img className="logo-nav" src="/logo.png" alt="Logo ACAPRA" />
        <p className="site-brand-name">ACAPRA</p>
      </Link>

      <button
        className="menu-toggle"
        onClick={() => setMenuOpen((current) => !current)}
        aria-label="Abrir menu"
        aria-expanded={menuOpen}
      >
        ☰
      </button>

      <nav
        className={`site-nav ${menuOpen ? "active" : ""}`}
        aria-label="Navegação principal"
      >
        <Link className="site-nav-link" to="/" onClick={closeMenu}>Início</Link>
        <Link className="site-nav-link" to="/adocao" onClick={closeMenu}>Adotar</Link>
        <Link className="site-nav-link" to="/voluntariado" onClick={closeMenu}>Faça Parte</Link>
        <Link className="site-nav-link" to="/produtos" onClick={closeMenu}>Produtos</Link>
        <div
          className={`site-news-dropdown ${newsOpen ? "open" : ""}`}
          onMouseLeave={() => setNewsOpen(false)}
        >
          <button
            type="button"
            className="site-nav-link site-dropdown-toggle"
            onClick={toggleNoticias}
            aria-expanded={newsOpen}
            aria-haspopup="menu"
          >
            Informações
          </button>
          <div className="site-dropdown-menu" role="menu" aria-label="Seções de informações">
            <Link className="site-dropdown-link" to="/informacoes" onClick={closeMenu}>Todas</Link>
            <Link className="site-dropdown-link" to="/noticias" onClick={closeMenu}>Notícias</Link>
            <Link className="site-dropdown-link" to="/resgates" onClick={closeMenu}>Resgates</Link>
            <Link className="site-dropdown-link" to="/campanhas" onClick={closeMenu}>Campanhas</Link>
          </div>
        </div>
        <Link className="site-nav-link" to="/doe" onClick={closeMenu}>Doe</Link>
        <Link className="site-nav-link" to="/transparencia" onClick={closeMenu}>Transparência</Link>

        {estaLogado && temAcessoDashboard(usuario) && (
          <Link className="site-nav-link" to="/dashboard" onClick={closeMenu}>
            Dashboard
          </Link>
        )}

        {estaLogado ? (
          <div className="site-user-menu">
            <Link className="site-user-link" to="/login" onClick={closeMenu}>
              <span className="site-user-label">Usuário</span>
              <strong>{nomeExibicao}</strong>
            </Link>
            <a
              className="site-whatsapp-link"
              href="https://wa.me/5549999999999"
              target="_blank"
              rel="noreferrer"
              aria-label="WhatsApp"
              title="WhatsApp"
            >
              <svg
                className="site-whatsapp-icon"
                viewBox="0 0 24 24"
                width="26"
                height="26"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 3 .97 4.29L2 22l6.29-.97C9.95 21.76 10.97 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.41 0-2.73-.27-3.97-.77l-.28-.12-2.91.45.45-2.91-.12-.28C4.27 14.73 4 13.41 4 12c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8zm3.89-12.27c-.37 0-.74.12-1.08.35-.78.57-1.29 1.5-1.29" />
              
              </svg>
            </a>
            <button type="button" className="site-logout-button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        ) : (
          <div className="site-nav-icons">
            <Link
              className="site-nav-link site-login-link"
              to="/login"
              onClick={closeMenu}
              aria-label="Entrar"
              title="Entrar"
            >
              <svg
                className="site-login-icon"
                viewBox="0 0 24 24"
                width="26"
                height="26"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" />
              </svg>
            </Link>
            <a
              className="site-whatsapp-link"
              href="https://wa.me/5549999999999"
              target="_blank"
              rel="noreferrer"
              aria-label="WhatsApp"
              title="WhatsApp"
            >
              <svg
                className="site-whatsapp-icon"
                viewBox="0 0 24 24"
                width="26"
                height="26"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 3 .97 4.29L2 22l6.29-.97C9.95 21.76 10.97 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.41 0-2.73-.27-3.97-.77l-.28-.12-2.91.45.45-2.91-.12-.28C4.27 14.73 4 13.41 4 12c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8zm3.89-12.27c-.37 0-.74.12-1.08.35-.78.57-1.29 1.5-1.29" />
              </svg>
            </a>
          </div>
        )}
      </nav>
    </header>
  );
}

export default Header;

