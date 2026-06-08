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
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-4.868 1.24l-.348.202-.361-.055c-1.287-.196-2.505-.584-3.572-1.177l-.544-.286-.628.326c-1.332.708-2.36 1.926-2.82 3.408-.459 1.482-.327 3.085.39 4.563.363.754.94 1.465 1.629 2.073l.326.31-.031.389c-.183 2.344.074 4.76 1.144 6.783l.205.410.483-.191c2.053-.814 3.976-2.038 5.624-3.61l.315-.297.393.064c1.224.2 2.502.271 3.79.157l.593-.064.305.298c1.649 1.572 3.572 2.796 5.625 3.61l.483.191.205-.41c1.07-2.023 1.327-4.439 1.144-6.783l-.031-.389.326-.31c.689-.608 1.266-1.319 1.629-2.073.717-1.478.849-3.081.39-4.563-.46-1.482-1.488-2.7-2.82-3.408l-.628-.326-.544.286c-1.067.593-2.285.981-3.572 1.177l-.361.055-.348-.202a9.87 9.87 0 00-4.864-1.24z" />
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

