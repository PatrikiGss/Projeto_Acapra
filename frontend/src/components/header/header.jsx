import "./header.css";

function Header() {
  return (
    <header className="site-header">
      <h1 className="site-brand">
          <img className="logo-nav" src="/logo.png" alt="Logo" />
          <p className="site-brand-name">ACAPRA</p>
      </h1>
      <nav className="site-nav" aria-label="Navegacao principal">
        <a className="site-nav-link" href="/">Inicio</a>
        <a className="site-nav-link" href="/">Login</a>
      </nav>
    </header>
  );
}

export default Header;
