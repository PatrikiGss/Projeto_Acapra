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
            Notícias
          </button>
          <div className="site-dropdown-menu" role="menu" aria-label="Seções de notícias">
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
            <button type="button" className="site-logout-button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        ) : (
          <Link className="site-nav-link site-login-link" to="/login" onClick={closeMenu}>
            Entrar
          </Link>
        )}
      </nav>
    </header>
  );
}

export default Header;

