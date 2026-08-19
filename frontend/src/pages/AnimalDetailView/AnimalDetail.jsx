import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../services/api";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import { logError } from "../../utils/logger";
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
                logError("AnimalDetail", erro);
                setError(true);
            })
            .finally(() => setLoading(false));
    }, [id]);

    const formatarTexto = (texto) => {
        if (!texto) return "";
        return texto.charAt(0).toUpperCase() + texto.slice(1);
    };

    const formatarDataCadastro = (valor) => {
        if (!valor) return "Data indisponível";

        const data = new Date(valor);
        if (Number.isNaN(data.getTime())) return "Data indisponível";

        return data.toLocaleDateString("pt-BR");
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
                                <img
                                    src={fotoAtual}
                                    alt={animal.nome_animal}
                                    width="1200"
                                    height="960"
                                    style={{
                                        objectPosition: `${(animal.foto_foco_x ?? 0.5) * 100}% ${(animal.foto_foco_y ?? 0.5) * 100}%`,
                                    }}
                                />

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
                    <p className="animal-created-at">Cadastrado em {formatarDataCadastro(animal.created_at)}</p>
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
                            <svg
                                className="interest-button-whatsapp-icon"
                                viewBox="0 0 24 24"
                                width="22"
                                height="22"
                                fill="currentColor"
                                aria-hidden="true"
                            >
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.978-1.418A9.956 9.956 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a7.946 7.946 0 0 1-4.337-1.284l-.31-.185-3.233.921.874-3.17-.202-.325A7.944 7.944 0 0 1 4 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z" />
                            </svg>
                            Quero adotar
                        </a>
                    ) : (
                        <button className="interest-button" type="button" disabled>
                            <svg
                                className="interest-button-whatsapp-icon"
                                viewBox="0 0 24 24"
                                width="22"
                                height="22"
                                fill="currentColor"
                                aria-hidden="true"
                            >
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.978-1.418A9.956 9.956 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a7.946 7.946 0 0 1-4.337-1.284l-.31-.185-3.233.921.874-3.17-.202-.325A7.944 7.944 0 0 1 4 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z" />
                            </svg>
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

