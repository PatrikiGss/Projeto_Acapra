import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { getMediaURL } from "../../services/api";
import "./Home.css";

const destaqueExemplo = {
  id: "exemplo",
  categoria: "noticias",
  categoria_display: "Notícia",
  titulo: "Campanha de arrecadação ganha novos pontos de coleta",
  resumo: "Voluntários organizaram novos locais para receber ração, cobertores e itens de limpeza para os animais acolhidos.",
  foto: "/carousel-voluntariado.jpg",
};

function Home() {
  const [animais, setAnimais] = useState([]);
  const [carregandoAnimais, setCarregandoAnimais] = useState(true);
  const [animalSlideAtual, setAnimalSlideAtual] = useState(0);
  const [destaquesInfo, setDestaquesInfo] = useState([destaqueExemplo]);
  const [destaqueAtual, setDestaqueAtual] = useState(0);

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
    api.get("/api/noticias/publicacoes/")
      .then((response) => {
        const publicacoes = response.data?.slice(0, 5);
        setDestaquesInfo(publicacoes?.length ? publicacoes : [destaqueExemplo]);
        setDestaqueAtual(0);
      })
      .catch(() => setDestaquesInfo([destaqueExemplo]));
  }, []);

  useEffect(() => {
    if (animais.length === 0) return;
    const timer = setInterval(() => {
      setAnimalSlideAtual((current) => (current + 1) % animais.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [animais.length]);

  useEffect(() => {
    const timer = setInterval(() => {
      setDestaqueAtual((current) => (current + 1) % destaquesInfo.length);
    }, 7000);

    return () => clearInterval(timer);
  }, [destaquesInfo.length]);

  useEffect(() => {
    const elementosAnimados = document.querySelectorAll(".scroll-reveal");

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.16,
      rootMargin: "0px 0px -60px 0px",
    });

    elementosAnimados.forEach((elemento) => observer.observe(elemento));

    return () => observer.disconnect();
  }, [animais]);

  const irParaAnimalAnterior = () => {
    setAnimalSlideAtual((current) => (
      current === 0 ? animais.length - 1 : current - 1
    ));
  };

  const irParaProximoAnimal = () => {
    setAnimalSlideAtual((current) => (current + 1) % animais.length);
  };

  const destaqueInfo = destaquesInfo[destaqueAtual] || destaqueExemplo;

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
            Resgatamos, cuidamos e encontramos famílias para animais.
          </p>

          <div className="hero-links">
            <Link to="/adocao" className="link">Adotar</Link>
            <Link to="/doe" className="link">Doar</Link>
          </div>
        </div>
      </section>

      <section className="about-section scroll-reveal" id="sobre">
        <div className="about-content">
          <div className="about-heading">
            <span className="section-kicker">Sobre Nós</span>
            <h2>ACAPRA somos todos nós</h2>
          </div>

          <p className="about-text">
            Somos uma ONG sem fins lucrativos movida por voluntários — mas, na prática,{" "}
            <strong>ACAPRA é qualquer pessoa que ajuda um animal</strong>. Quando você
            resgata um bichinho jogado na rua, quando ajuda a encontrar um lar para eles,
            quando doa dinheiro para um atendimento ou doa ração — você é ACAPRA.
            Nossa casa é todo lugar onde os bichinhos são acolhidos.
          </p>
        </div>
      </section>

      <section className="adote-section scroll-reveal" id="adote">
        <div className="section-heading">
          <span className="section-kicker">Adote</span>
          <h2>Animais esperando por uma família</h2>
          <p>
            Conheça os últimos animais disponibilizados para adoção pela Acapra.
          </p>
        </div>

        {carregandoAnimais && (
          <p className="section-status">Carregando animais para adoção...</p>
        )}

        {!carregandoAnimais && animais.length === 0 && (
          <p className="section-status">
            Nenhum animal disponível para adoção no momento.
          </p>
        )}

        {!carregandoAnimais && animais.length > 0 && (
          <div className="animal-carousel">
            <div className="carousel-viewport">
              {animais.map((animal, index) => (
                <Link
                  className={`home-animal-card ${index === animalSlideAtual ? "active" : ""}`}
                  to={`/adocao/${animal.id}`}
                  key={animal.id}
                >
                  <img
                    src={animal.foto || animal.fotos?.[0] || "/adocao-cachorro.png"}
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

            {animais.length > 1 && (
              <>
                <div className="carousel-controls">
                  <button
                    type="button"
                    onClick={irParaAnimalAnterior}
                    aria-label="Animal anterior"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={irParaProximoAnimal}
                    aria-label="Próximo animal"
                  >
                    ›
                  </button>
                </div>

                <div className="carousel-dots">
                  {animais.map((_, index) => (
                    <button
                      key={index}
                      className={index === animalSlideAtual ? "active" : ""}
                      onClick={() => setAnimalSlideAtual(index)}
                      aria-label={`Ir para animal ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </section>

      <section className="produtos-section scroll-reveal" id="produtos">
        <div className="produtos-layout">
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

          <div className="produtos-image">
            <img
              src="/produtos-solidarios.png"
              alt="Gato com carrinho de compras representando produtos solidários"
            />
          </div>
        </div>
      </section>

      <section className="fresh-news-section scroll-reveal" aria-label="Informações recentes em destaque">
        <div className="fresh-news-wrapper">
          <Link
            className="fresh-news-banner"
            to={destaqueInfo.id === "exemplo"
              ? "/informacoes"
              : `/informacoes/${destaqueInfo.categoria}/${destaqueInfo.id}`}
          >
            <div className="fresh-news-image">
              <img
                src={destaqueInfo.foto?.startsWith("/")
                  ? destaqueInfo.foto
                  : getMediaURL(destaqueInfo.foto)}
                alt={destaqueInfo.titulo}
              />
            </div>

            <div className="fresh-news-copy">
              <span>Boas notícias saindo do forno</span>
              <h2>{destaqueInfo.titulo}</h2>
              <p>{destaqueInfo.resumo}</p>
              <strong>{destaqueInfo.categoria_display || "Informação"}</strong>
            </div>
          </Link>

          {destaquesInfo.length > 1 && (
            <div className="fresh-news-dots" aria-label="Publicações recentes">
              {destaquesInfo.map((item, index) => (
                <button
                  className={index === destaqueAtual ? "active" : ""}
                  type="button"
                  onClick={() => setDestaqueAtual(index)}
                  aria-label={`Mostrar ${item.titulo}`}
                  key={`${item.id}-${item.titulo}`}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default Home;