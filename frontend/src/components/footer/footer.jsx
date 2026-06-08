import { Link } from "react-router-dom";
import "./footer.css";

function Footer() {
  return (
    <footer className="site-footer" id="contato">
      <div className="footer-brand">
        <img src="/logo.png" alt="Logo Acapra" />
        <div>
          <strong>ACAPRA</strong>
          <p>Associação Joaquinense de Proteção aos Animais</p>
        </div>
      </div>

      <nav className="footer-nav" aria-label="Navegação rápida">
        <div className="footer-nav-col">
          <span className="footer-nav-heading">Animais</span>
          <Link to="/adocao">Adotar</Link>
          <Link to="/desaparecidos">Desaparecidos</Link>
          <Link to="/resgates">Resgates</Link>
        </div>
        <div className="footer-nav-col">
          <span className="footer-nav-heading">Apoiar</span>
          <Link to="/doe">Doe</Link>
          <Link to="/voluntariado">Faça Parte</Link>
          <Link to="/produtos">Produtos</Link>
        </div>
        <div className="footer-nav-col">
          <span className="footer-nav-heading">Informações</span>
          <Link to="/noticias">Notícias</Link>
          <Link to="/transparencia">Transparência</Link>
          <Link to="/denuncias">Denúncias</Link>
        </div>
      </nav>

      <div className="footer-contact">
        <a href="mailto:contato@acapra.org.br">contato@acapra.org.br</a>
        <a href="tel:+5549999999999">(49) 99999-9999</a>
        <a href="https://www.instagram.com/acapra.sj" target="_blank" rel="noreferrer">
          @acapra.sj
        </a>
        <p className="footer-copy">© 2026 Acapra</p>
      </div>
    </footer>
  );
}

export default Footer;
