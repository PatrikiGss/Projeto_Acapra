import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api, { getMediaURL } from "../../services/api";
import { getResponseItems } from "../../utils/collection";
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
  const [indicadores, setIndicadores] = useState([]);
  const animalPausado = useRef(false);
  const noticiasPausada = useRef(false);

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
    api.get("/api/transparencia/indicadores/")
      .then((res) => setIndicadores(res.data || []))
      .catch(() => setIndicadores([]));
  }, []);

  useEffect(() => {
    api.get("/api/noticias/publicacoes/")
      .then((response) => {
        const publicacoes = getResponseItems(response.data).slice(0, 5);
        setDestaquesInfo(publicacoes.length ? publicacoes : [destaqueExemplo]);
        setDestaqueAtual(0);
      })
      .catch(() => setDestaquesInfo([destaqueExemplo]));
  }, []);

  useEffect(() => {
    if (animais.length === 0) return;
    const isMobile = () => window.innerWidth < 768;
    if (!isMobile()) return;

    const timer = setInterval(() => {
      if (!animalPausado.current) {
        setAnimalSlideAtual((current) => (current + 1) % animais.length);
      }
    }, 6000);

    return () => clearInterval(timer);
  }, [animais.length]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!noticiasPausada.current) {
        setDestaqueAtual((current) => (current + 1) % destaquesInfo.length);
      }
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

  const destaqueInfo = destaquesInfo[destaqueAtual] || destaqueExemplo;

  return (
    <div className="main">
      <section className="hero">
        <div className="hero-image">
          <img src="/hero-acapra.webp" alt="Filhote resgatado pela ACAPRA" className="hero-img" />
        </div>

        <div className="hero-content">
          <h1 className="hero-text">
            Associação Catarinense de Proteção aos Animais
          </h1>

          <p className="hero-subtitle">
            Resgatamos, cuidamos e encontramos famílias para animais.
          </p>

          <div className="hero-links">
            <Link to="/adocao" className="link">Quero Adotar!</Link>
            <Link to="/contato" className="link">Entre em Contato</Link>
          </div>
        </div>
      </section>

      <section className="about-section scroll-reveal" id="sobre">
        <div className="about-content">
          <div className="about-heading">
            <span className="section-kicker">Sobre Nós</span>
            <h2>ACAPRA somos todos nós!</h2>
          </div>

          <div className="about-body">
            <p className="about-text">
              A ACAPRA é uma ONG sem fins lucrativos fundada em São Joaquim (SC) com a missão de resgatar, cuidar e encontrar lares para animais em situação de vulnerabilidade.{" "}
              <strong>Somos movidos pelo voluntariado e pela solidariedade da comunidade.</strong>{" "}
              Atuamos no resgate de animais abandonados e vítimas de maus-tratos, na realização de castrações para controle populacional e na promoção da adoção responsável — tudo isso com transparência e prestação de contas à sociedade.
            </p>

            {indicadores.length > 0 && (
              <div className="about-stats">
                {indicadores.map((ind) => (
                  <div className="about-stat" key={ind.id}>
                    <span className="about-stat-valor">
                      {Number(ind.valor).toLocaleString("pt-BR")}
                    </span>
                    <span className="about-stat-rotulo">{ind.chave_display}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
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
          <div
            className="animal-carousel"
            onMouseEnter={() => { animalPausado.current = true; }}
            onMouseLeave={() => { animalPausado.current = false; }}
          >
            <div className="carousel-viewport">
              {animais.map((animal, index) => (
                <Link
                  className={`home-animal-card ${index === animalSlideAtual ? "active" : ""}`}
                  to={`/adocao/${animal.id}`}
                  key={animal.id}
                  aria-hidden={index !== animalSlideAtual ? "true" : undefined}
                  tabIndex={index !== animalSlideAtual ? -1 : undefined}
                >
                  <img
                    src={animal.foto || animal.fotos?.[0] || "/adocao-cachorro.webp"}
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
            )}
          </div>
        )}

        <div className="adote-cta">
          <Link to="/adocao" className="link adote-ver-todos">Ver todos os animais</Link>
        </div>
      </section>

      <section className="doe-section scroll-reveal">
        <div className="doe-content">
          <div className="doe-text">
            <span className="section-kicker">Apoie</span>
            <h2>Sua doação salva vidas</h2>
            <p>
              Cada contribuição vai diretamente para alimentação, medicamentos, castrações e resgate dos animais acolhidos pela ACAPRA.
            </p>
          </div>
          <Link to="/doe" className="link doe-link">Quero Doar</Link>
        </div>
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
              src="/produtos-solidarios.webp"
              alt="Gato com carrinho de compras representando produtos solidários"
            />
          </div>
        </div>
      </section>

      

      <section className="denuncia-cta-section scroll-reveal">
        <div className="doe-content">
          <div className="doe-text">
            <span className="section-kicker">Denuncie</span>
            <h2>Viu um animal sofrendo? Conte-nos.</h2>
            <p>
              Denúncias de maus-tratos e abandono podem salvar vidas. Sua identidade é protegida e agimos o mais rápido possível.
            </p>
          </div>
          <Link to="/denuncias" className="link doe-link">Fazer uma denúncia</Link>
        </div>
      </section>

      <section
        className="fresh-news-section scroll-reveal"
        aria-label="Informações recentes em destaque"
        onMouseEnter={() => { noticiasPausada.current = true; }}
        onMouseLeave={() => { noticiasPausada.current = false; }}
      >
        <div className="fresh-news-wrapper">
          <div className="section-heading">
            <span className="section-kicker">Notícias</span>
            <h2>Últimas da ACAPRA</h2>
          </div>
          <Link
            className="fresh-news-banner"
            to={destaqueInfo.id === "exemplo"
              ? "/noticias"
              : `/noticias/${destaqueInfo.id}`}
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
              <span>Notícias da Acapra!</span>
              <h3>{destaqueInfo.titulo}</h3>
              <p>{destaqueInfo.resumo}</p>
              <strong>{destaqueInfo.categoria_display || "Informação"}</strong>
            </div>
          </Link>

          {destaquesInfo.length > 1 && (
            <>
              <div className="carousel-controls">
                <button
                  type="button"
                  onClick={() => setDestaqueAtual((current) => (current === 0 ? destaquesInfo.length - 1 : current - 1))}
                  aria-label="Publicação anterior"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setDestaqueAtual((current) => (current + 1) % destaquesInfo.length)}
                  aria-label="Próxima publicação"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>

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
            </>
          )}
        </div>
      </section>

    </div>
  );
}

export default Home;