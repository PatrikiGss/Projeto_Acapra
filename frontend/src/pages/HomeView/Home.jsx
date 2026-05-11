import { useEffect, useState } from "react";
import "./Home.css"

function Home() {
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("http://localhost:8000/")
      .then(res => res.json())
      .then(data => setMsg(data.message));
  }, []);

  return (
    <div className="main">
      <section className="hero">
        <img className="hero-img" src="/hero.jpg" alt="" />

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