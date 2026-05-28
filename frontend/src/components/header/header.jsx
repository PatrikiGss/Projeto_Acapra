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

      <button
        className="menu-toggle"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Abrir menu"
      >
        ☰
      </button>

      <nav
        className={`site-nav ${menuOpen ? "active" : ""}`}
        aria-label="Navegação principal"
      >
        <a className="site-nav-link" href="/">Início</a>
        <a className="site-nav-link" href="/adocao">Adotar</a>
        <a className="site-nav-link" href="/voluntariado">Faça Parte</a>
        <a className="site-nav-link" href="/">Resgates</a>
        <a className="site-nav-link" href="/produtos">Produtos</a>
        <a className="site-nav-link" href="/doe">Doe</a>
        <a className="site-nav-link" href="/">Transparência</a>
      </nav>
    </header>
  );
}

export default Header;
