import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../services/api";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import "./AnimalDetail.css";

function AnimalDetail() {
    const { id } = useParams();
    const [animal, setAnimal] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [fotoIndex, setFotoIndex] = useState(0);

    useEffect(() => {
        api.get(`/api/adocao/animais/${id}/`)
            .then((response) => {
                setAnimal(response.data);
                setError(false);
            })
            .catch((erro) => {
                console.error(erro);
                setError(true);
            })
            .finally(() => setLoading(false));
    }, [id]);

    const formatarTexto = (texto) => {
        if (!texto) return "";
        return texto.charAt(0).toUpperCase() + texto.slice(1);
    };

    const criarLinkWhatsApp = (telefone) => {
        if (!telefone) return null;

        const digits = String(telefone).replace(/\D/g, "");
        if (!digits) return null;

        const normalized = digits.startsWith("55") && digits.length >= 12
            ? digits
            : `55${digits}`;

        return `https://wa.me/${normalized}`;
    };

    const whatsappHref = criarLinkWhatsApp(animal?.telefone);
    const fotos = useMemo(() => {
        const imagens = [animal?.foto, ...(animal?.fotos || [])].filter(Boolean);
        return [...new Set(imagens)];
    }, [animal]);

    useEffect(() => {
        if (fotos.length <= 1) return undefined;

        const timer = setInterval(() => {
            setFotoIndex((current) => (current + 1) % fotos.length);
        }, 5000);

        return () => clearInterval(timer);
    }, [fotos.length]);

    const irParaAnterior = () => {
        setFotoIndex((current) => (current === 0 ? fotos.length - 1 : current - 1));
    };

    const irParaProxima = () => {
        setFotoIndex((current) => (current + 1) % fotos.length);
    };

    const fotoAtual = fotos.length > 0 ? fotos[fotoIndex % fotos.length] : null;

    const selecionarFoto = (index) => {
        setFotoIndex(index);
    };

    if (loading) {
        return (
            <main className="animal-detail-page">
                <div className="animal-detail-message">
                    <LoadingSpinner label="Carregando animal..." />
                </div>
            </main>
        );
    }

    if (error || !animal) {
        return (
            <main className="animal-detail-page">
                <div className="animal-detail-message">
                    Não foi possível encontrar este animal.
                    <Link to="/adocao">Voltar para adoção</Link>
                </div>
            </main>
        );
    }

    return (
        <main className="animal-detail-page">
            <section className="animal-detail">
                <div className="animal-gallery">
                    <div className="animal-main-image">
                        {fotoAtual ? (
                            <>
                                <img src={fotoAtual} alt={animal.nome_animal} width="1200" height="900" />

                                {fotos.length > 1 && (
                                    <>
                                        <button
                                            type="button"
                                            className="animal-carousel-arrow animal-carousel-arrow-left"
                                            onClick={irParaAnterior}
                                            aria-label="Foto anterior"
                                        >
                                            <span aria-hidden="true">&lt;</span>
                                        </button>
                                        <button
                                            type="button"
                                            className="animal-carousel-arrow animal-carousel-arrow-right"
                                            onClick={irParaProxima}
                                            aria-label="Próxima foto"
                                        >
                                            <span aria-hidden="true">&gt;</span>
                                        </button>
                                    </>
                                )}
                            </>
                        ) : (
                            <div className="animal-detail-placeholder">ACAPRA</div>
                        )}
                    </div>

                    {fotos.length > 1 && (
                        <div className="animal-carousel-dots" aria-label="Fotos do animal">
                            {fotos.map((foto, index) => (
                                <button
                                    type="button"
                                    key={foto}
                                    className={`animal-carousel-dot ${fotoIndex === index ? "active" : ""}`}
                                    onClick={() => selecionarFoto(index)}
                                    aria-label={`Ver foto ${index + 1} de ${animal.nome_animal}`}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <div className="animal-summary">
                    <h1>{animal.nome_animal}</h1>
                    <dl className="animal-specs">
                        <div>
                            <dt>Espécie</dt>
                            <dd>{formatarTexto(animal.especie)}</dd>
                        </div>
                        <div>
                            <dt>Sexo</dt>
                            <dd>{formatarTexto(animal.sexo)}</dd>
                        </div>
                    </dl>

                    {whatsappHref ? (
                        <a
                            className="interest-button"
                            href={whatsappHref}
                            target="_blank"
                            rel="noreferrer noopener"
                        >
                            Quero adotar
                        </a>
                    ) : (
                        <button className="interest-button" type="button" disabled>
                            Quero adotar
                        </button>
                    )}

                    <section className="description-panel">
                        <h2>Doador</h2>
                        <p>{animal.nome_doador}</p>
                    </section>

                    {animal.descricao && (
                        <section className="description-panel">
                            <h2>Descrição</h2>
                            <p>{animal.descricao}</p>
                        </section>
                    )}
                </div>
            </section>
        </main>
    );
}

export default AnimalDetail;

