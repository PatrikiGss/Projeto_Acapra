import { useState } from "react";
import "./header.css";

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="site-header">
      <h1 className="site-brand">
        <img className="logo-nav" src="/logo.png" alt="Logo" />
        <p className="site-brand-name">ACAPRA</p>
      </h1>

      {/* BOTÃO MOBILE */}
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
        <a className="site-nav-link" href="/">Inicio</a>
        <a className="site-nav-link" href="/">Adotar</a>
        <a className="site-nav-link" href="/">Faça Parte</a>
        <a className="site-nav-link" href="/">Resgates</a>
        <a className="site-nav-link" href="/">Produtos</a>
        <a className="site-nav-link" href="/">Doe</a>
        <a className="site-nav-link" href="/">Transparência</a>
      </nav>
    </header>
  );
}

export default Header;