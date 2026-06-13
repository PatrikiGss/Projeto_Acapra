import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { safeExternalUrl } from "../../utils/url";
import "./footer.css";

function toWhatsAppHref(numero) {
  const digits = numero.replace(/\D/g, "");
  const num = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${num}`;
}

function Footer() {
  const [contato, setContato] = useState(null);

  useEffect(() => {
    api.get("/api/contato/").then((res) => setContato(res.data)).catch(() => {});
  }, []);

  const primeiroWhatsApp =
    contato?.whatsapp_castracoes ||
    contato?.whatsapp_doacoes ||
    contato?.whatsapp_financeiro ||
    null;

  // URLs definidas por admin: só renderiza se forem http(s) seguras
  // (bloqueia javascript:, data:, etc.).
  const instagramUrl = safeExternalUrl(contato?.instagram);
  const facebookUrl = safeExternalUrl(contato?.facebook);

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
        {contato?.email && (
          <a href={`mailto:${contato.email}`}>{contato.email}</a>
        )}
        {primeiroWhatsApp && (
          <a href={toWhatsAppHref(primeiroWhatsApp)} target="_blank" rel="noopener noreferrer">
            {primeiroWhatsApp}
          </a>
        )}
        {instagramUrl && (
          <a href={instagramUrl} target="_blank" rel="noopener noreferrer">
            Instagram
          </a>
        )}
        {facebookUrl && (
          <a href={facebookUrl} target="_blank" rel="noopener noreferrer">
            Facebook
          </a>
        )}
        <p className="footer-copy">© 2026 Acapra</p>
      </div>
    </footer>
  );
}

export default Footer;
