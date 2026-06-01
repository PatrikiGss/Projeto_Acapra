import "./footer.css"

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

      <div className="footer-contact">
        <a href="mailto:contato@acapra.org.br">contato@acapra.org.br</a>
        <a href="tel:+5549999999999">(49) 99999-9999</a>
        <a href="https://www.instagram.com/acapra.sj" target="_blank" rel="noreferrer">
          @acapra.sj
        </a>
      </div>

      <p className="footer-copy">© 2026 Acapra</p>
    </footer>
  );
}

export default Footer;
