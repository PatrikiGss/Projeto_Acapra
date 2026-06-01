import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import "./Home.css";

const carouselItems = [
  {
    title: "Produtos que ajudam a Acapra",
    description: "Compre produtos solidários e ajude a transformar cada venda em cuidado para os animais.",
    image: "/carousel-produtos.jpg",
    alt: "Cão e gato em um carrinho de compras",
    link: "/produtos",
    action: "Conheça os produtos",
  },
  {
    title: "Adote um novo amigo",
    description: "Conheça cães e gatos que estão esperando uma família para chamar de sua.",
    image: "/carousel-adocao.jpg",
    alt: "Cão e gato juntos debaixo de uma manta",
    link: "/adocao",
    action: "Ver animais",
  },
  {
    title: "Seja voluntário",
    description: "Doe tempo, carinho e presença para fortalecer o trabalho da ONG.",
    image: "/carousel-voluntariado.jpg",
    alt: "Cão e gato dormindo abraçados",
    link: "/voluntariado",
    action: "Faça parte",
  },
];

function Home() {
  const [animais, setAnimais] = useState([]);
  const [carregandoAnimais, setCarregandoAnimais] = useState(true);
  const [slideAtual, setSlideAtual] = useState(0);

  useEffect(() => {
    api.get("/api/adocao/animais/")
      .then((response) => {
        setAnimais(response.data.slice(0, 3));
      })
      .catch(() => {
        setAnimais([]);
      })
      .finally(() => setCarregandoAnimais(false));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlideAtual((current) => (current + 1) % carouselItems.length);
    }, 6000);

    return () => clearInterval(timer);
  }, []);

  const irParaSlideAnterior = () => {
    setSlideAtual((current) => (
      current === 0 ? carouselItems.length - 1 : current - 1
    ));
  };

  const irParaProximoSlide = () => {
    setSlideAtual((current) => (current + 1) % carouselItems.length);
  };

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

      <section className="home-carousel" aria-label="Destaques da Acapra">
        <div className="carousel-viewport">
          {carouselItems.map((item, index) => (
            <Link
              className={`carousel-slide ${index === slideAtual ? "active" : ""}`}
              to={item.link}
              key={item.title}
              aria-hidden={index !== slideAtual}
            >
              <img src={item.image} alt={item.alt} />
              <div className="carousel-content">
                <span>{item.action}</span>
                <h2>{item.title}</h2>
                <p>{item.description}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="carousel-controls">
          <button type="button" onClick={irParaSlideAnterior} aria-label="Slide anterior">
            ‹
          </button>

          <div className="carousel-dots" aria-label="Selecionar destaque">
            {carouselItems.map((item, index) => (
              <button
                className={index === slideAtual ? "active" : ""}
                type="button"
                onClick={() => setSlideAtual(index)}
                aria-label={`Ir para ${item.title}`}
                key={item.title}
              />
            ))}
          </div>

          <button type="button" onClick={irParaProximoSlide} aria-label="Próximo slide">
            ›
          </button>
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

      <section className="adote-section" id="adote">
        <div className="section-heading">
          <span className="section-kicker">Adote</span>
          <h2>Animais esperando por uma família</h2>
          <p>
            Conheça os últimos animais disponibilizados para adoção pela Acapra.
          </p>
        </div>

        <div className="animal-grid">
          {carregandoAnimais && (
            <p className="section-status">Carregando animais para adoção...</p>
          )}

          {!carregandoAnimais && animais.length === 0 && (
            <p className="section-status">
              Nenhum animal disponível para adoção no momento.
            </p>
          )}

          {animais.map((animal) => (
            <Link className="home-animal-card" to={`/adocao/${animal.id}`} key={animal.id}>
              <img
                src={animal.foto || "/adocao-cachorro.png"}
                alt={animal.nome_animal || "Animal para adoção"}
              />

              <div className="home-animal-card-content">
                <span>{animal.especie}</span>
                <h3>{animal.nome_animal}</h3>
                <p>
                  {animal.descricao ||
                    "Animal acolhido pela Acapra e pronto para encontrar um novo lar."}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="produtos-section" id="produtos">
        <div className="produtos-content">
          <span className="section-kicker">Produtos solidários</span>
          <h2>Compre e ajude a manter o cuidado com os animais</h2>
          <p>
            Todo o valor arrecadado com os produtos da Acapra é reutilizado na
            ONG para apoiar resgates, alimentação, medicação, castrações e a
            manutenção dos animais acolhidos.
          </p>
          <Link to="/produtos" className="link produtos-link">
            Conheça nossos produtos
          </Link>
        </div>
      </section>
    </div>
  );
}

export default Home;
