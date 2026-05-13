import { useEffect, useState } from "react";
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
            <a href="#" className="link">Adotar</a>
            <a href="#" className="link">Doar</a>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;