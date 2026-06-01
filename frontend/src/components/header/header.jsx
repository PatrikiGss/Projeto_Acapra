import { useState } from "react";
import { Link } from "react-router-dom";
import "./header.css";

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="site-header">
      <Link className="site-brand" to="/" onClick={closeMenu}>
        <img className="logo-nav" src="/logo.png" alt="Logo" />
        <p className="site-brand-name">ACAPRA</p>
      </Link>

      <button
        className="menu-toggle"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Abrir menu"
      >
        ☰
      </button>

      {/* NAV */}
      <nav
        className={`site-nav ${menuOpen ? "active" : ""}`}
        aria-label="Navegacao principal"
      >
        <Link className="site-nav-link" to="/" onClick={closeMenu}>Inicio</Link>
        <Link className="site-nav-link" to="/adocao" onClick={closeMenu}>Adotar</Link>
        <Link className="site-nav-link" to="/voluntariado" onClick={closeMenu}>Faça Parte</Link>
        <Link className="site-nav-link" to="/produtos" onClick={closeMenu}>Produtos</Link>
        <Link className="site-nav-link" to="/doe" onClick={closeMenu}>Doe</Link>
        <Link className="site-nav-link" to="/login" onClick={closeMenu}>Entrar</Link>
      </nav>
    </header>
  );
}

export default Header;
