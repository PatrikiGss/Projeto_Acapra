import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import api from "../../services/api";
import { getStoredUser, isLoggedIn, subscribeToAuthChanges } from "../../utils/auth";
import { temAcessoDashboard } from "../../utils/permissions";
import "./header.css";

function Header() {
  const { pathname } = useLocation();

  const noticiasPaths = ["/informacoes", "/resgates", "/campanhas", "/desaparecidos"];
  const apoiePaths = ["/doe", "/transparencia"];
  const noticiastActive = noticiasPaths.some((p) => pathname.startsWith(p));
  const apoieActive = apoiePaths.some((p) => pathname.startsWith(p));
  const [menuOpen, setMenuOpen] = useState(false);
  const [newsOpen, setNewsOpen] = useState(false);
  const [apoieOpen, setApoieOpen] = useState(false);
  const [estaLogado, setEstaLogado] = useState(isLoggedIn());
  const [usuario, setUsuario] = useState(getStoredUser());

  const closeMenu = () => {
    setMenuOpen(false);
    setNewsOpen(false);
    setApoieOpen(false);
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
    const nome = usuario.nome || usuario.email || "Usuário";
    const maxChars = 15;
    return nome.length > maxChars ? `${nome.substring(0, maxChars)}...` : nome;
  }, [usuario]);

  const refNoticias = useRef(null);
  const refApoie = useRef(null);

  const toggleNoticias = () => setNewsOpen((c) => !c);
  const toggleApoie = () => setApoieOpen((c) => !c);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (refNoticias.current && !refNoticias.current.contains(e.target)) {
        setNewsOpen(false);
      }
      if (refApoie.current && !refApoie.current.contains(e.target)) {
        setApoieOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  return (
    <header className="site-header">
      <Link className="site-brand" to="/" onClick={closeMenu}>
        <img className="logo-nav" src="/logo.png" alt="Logo ACAPRA" />
        <span className="site-brand-name">ACAPRA</span>
      </Link>

      <button
        className="menu-toggle"
        onClick={() => setMenuOpen((c) => !c)}
        aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
        aria-expanded={menuOpen}
      >
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
          {menuOpen ? (
            <>
              <line x1="4" y1="4" x2="20" y2="20" />
              <line x1="20" y1="4" x2="4" y2="20" />
            </>
          ) : (
            <>
              <line x1="3" y1="7" x2="21" y2="7" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="17" x2="21" y2="17" />
            </>
          )}
        </svg>
      </button>

      <nav
        className={`site-nav ${menuOpen ? "active" : ""}`}
        aria-label="Navegação principal"
      >
        <NavLink className={({ isActive }) => `site-nav-link${isActive ? " site-nav-link--active" : ""}`} to="/" onClick={closeMenu} end>Início</NavLink>
        <NavLink className={({ isActive }) => `site-nav-link${isActive ? " site-nav-link--active" : ""}`} to="/adocao" onClick={closeMenu}>Adotar</NavLink>
        <NavLink className={({ isActive }) => `site-nav-link${isActive ? " site-nav-link--active" : ""}`} to="/castracao" onClick={closeMenu}>Castração</NavLink>
        <NavLink className={({ isActive }) => `site-nav-link${isActive ? " site-nav-link--active" : ""}`} to="/denuncias" onClick={closeMenu}>Denuncie</NavLink>
        <NavLink className={({ isActive }) => `site-nav-link${isActive ? " site-nav-link--active" : ""}`} to="/produtos" onClick={closeMenu}>Produtos</NavLink>

        <div
          ref={refNoticias}
          className={`site-news-dropdown ${newsOpen ? "open" : ""}`}
        >
          <button
            type="button"
            className={`site-nav-link site-dropdown-toggle${noticiastActive ? " site-nav-link--active" : ""}`}
            onClick={toggleNoticias}
            aria-expanded={newsOpen}
            aria-haspopup="menu"
          >
            Notícias
          </button>
          <div className="site-dropdown-menu" role="menu" aria-label="Seções de informações">
            <Link className="site-dropdown-link" to="/informacoes" onClick={closeMenu}>Todas</Link>
            <Link className="site-dropdown-link" to="/resgates" onClick={closeMenu}>Resgates</Link>
            <Link className="site-dropdown-link" to="/campanhas" onClick={closeMenu}>Campanhas</Link>
            <Link className="site-dropdown-link" to="/desaparecidos" onClick={closeMenu}>Desaparecidos</Link>
          </div>
        </div>

        <div
          ref={refApoie}
          className={`site-news-dropdown ${apoieOpen ? "open" : ""}`}
        >
          <button
            type="button"
            className={`site-nav-link site-dropdown-toggle${apoieActive ? " site-nav-link--active" : ""}`}
            onClick={toggleApoie}
            aria-expanded={apoieOpen}
            aria-haspopup="menu"
          >
            Apoie
          </button>
          <div className="site-dropdown-menu" role="menu" aria-label="Seções de apoio">
            <Link className="site-dropdown-link" to="/doe" onClick={closeMenu}>Doe</Link>
            <Link className="site-dropdown-link" to="/transparencia" onClick={closeMenu}>Transparência</Link>
          </div>
        </div>

        <NavLink className={({ isActive }) => `site-nav-link${isActive ? " site-nav-link--active" : ""}`} to="/voluntariado" onClick={closeMenu}>Participe</NavLink>

        {estaLogado && temAcessoDashboard(usuario) && (
          <Link className="site-nav-link" to="/dashboard" onClick={closeMenu}>
            Dashboard
          </Link>
        )}

        {estaLogado ? (
          <div className="site-user-menu">
            <div className="site-user-link">
              <span className="site-user-label">Usuário</span>
              <strong>{nomeExibicao}</strong>
            </div>
            <Link
              className="site-whatsapp-link"
              to="/contato"
              onClick={closeMenu}
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
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.978-1.418A9.956 9.956 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a7.946 7.946 0 0 1-4.337-1.284l-.31-.185-3.233.921.874-3.17-.202-.325A7.944 7.944 0 0 1 4 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z" />
              </svg>
            </Link>
            <Link
              className="site-login-link"
              to="/perfil"
              onClick={closeMenu}
              aria-label="Meu perfil"
              title="Meu perfil"
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
          </div>
        ) : (
          <div className="site-nav-icons">
            <Link
              className="site-whatsapp-link"
              to="/contato"
              onClick={closeMenu}
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
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.978-1.418A9.956 9.956 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a7.946 7.946 0 0 1-4.337-1.284l-.31-.185-3.233.921.874-3.17-.202-.325A7.944 7.944 0 0 1 4 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z" />
              </svg>
            </Link>
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
          </div>
        )}
      </nav>
    </header>
  );
}

export default Header;
