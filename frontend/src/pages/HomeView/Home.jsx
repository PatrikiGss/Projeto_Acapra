import { Link } from "react-router-dom";
import "./Home.css";

function Home() {
  return (
    <div className="main">
      <section className="hero">
        <img
          className="hero-img"
          src="/hero-animals.png"
          alt="Cães da associação"
        />

        <div className="hero-content">
          <h1 className="hero-text">
            Associação Joaquinense de Proteção aos Animais
          </h1>

          <p className="hero-subtitle">
            Resgatamos, cuidamos e encontramos famílias para cães abandonados.
          </p>

          <div className="hero-links">
            <Link to="/adocao" className="link">Adotar</Link>
            <Link to="/doe" className="link">Doar</Link>
          </div>
        </div>
      </section>

      <section className="about-section" id="sobre">
        <div className="about-content">
          <h2>Sobre Nós</h2>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Molestiae architecto veniam, voluptatibus quis doloribus asperiores esse deleniti debitis optio magni neque iure, accusamus nobis recusandae ut autem tempore soluta iusto?
          </p>
        </div>
      </section>
    </div>
  );
}

export default Home;
