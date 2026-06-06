import logo from "../../assets/acapra.jpeg";
import "./header.css"

function Header() {
  return (
    <header>
      <div className="header-logo">
        <img src={logo} alt="Logo Acapra" />
        <h1>Acapra</h1>
      </div>
      <nav>
        <a href="/">Início</a>
      </nav>
    </header>
  );
}

export default Header;