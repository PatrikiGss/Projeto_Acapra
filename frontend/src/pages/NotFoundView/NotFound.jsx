import { Link } from "react-router-dom";
import "./NotFound.css";

function NotFound() {
  return (
    <div className="notfound-page">
      <span className="notfound-code">404</span>
      <h1 className="notfound-title">Página não encontrada</h1>
      <p className="notfound-desc">O endereço que você acessou não existe ou foi movido.</p>
      <Link to="/" className="notfound-link">Voltar ao início</Link>
    </div>
  );
}

export default NotFound;
