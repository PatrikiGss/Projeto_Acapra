import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import api, { getMediaURL } from "../../services/api";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import { logError } from "../../utils/logger";
import "./ProdutoDetail.css";

function ProdutoDetail() {
    const { id } = useParams();
    const [produto, setProduto] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [fotoIndex, setFotoIndex] = useState(0);

    useEffect(() => {
        api.get(`/api/vendas/produtos/${id}/`)
            .then((response) => {
                setProduto(response.data);
                setError(false);
            })
            .catch((erro) => {
                logError("ProdutoDetail", erro);
                setError(true);
            })
            .finally(() => setLoading(false));
    }, [id]);

    const WHATSAPP_ACAPRA = "5549999999999";

    const linkWhatsApp = useMemo(() => {
        if (!produto) return null;
        const mensagem = `Olá! Tenho interesse no produto "${produto.nome}".`;
        return `https://wa.me/${WHATSAPP_ACAPRA}?text=${encodeURIComponent(mensagem)}`;
    }, [produto]);

    const formatarPreco = (preco) => {
        return Number(preco).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
        });
    };

    const fotos = useMemo(() => {
        const imagens = [produto?.foto, ...(produto?.fotos || [])].filter(Boolean);
        return [...new Set(imagens)];
    }, [produto]);

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
    const fotoAtualUrl = fotoAtual ? getMediaURL(fotoAtual) : null;

    const selecionarFoto = (index) => {
        setFotoIndex(index);
    };

    if (loading) {
        return (
            <main className="produto-detail-page">
                <div className="produto-detail-message">
                    <LoadingSpinner label="Carregando produto..." />
                </div>
            </main>
        );
    }

    if (error || !produto) {
        return (
            <main className="produto-detail-page">
                <div className="produto-detail-message">
                    Não foi possível encontrar este produto.
                </div>
            </main>
        );
    }

    return (
        <main className="produto-detail-page">
            <section className="produto-detail">
                <div className="produto-gallery">
                    <div className="produto-main-image">
                        {fotoAtualUrl ? (
                            <>
                                <img src={fotoAtualUrl} alt={produto.nome} width="1200" height="900" />

                                {fotos.length > 1 && (
                                    <>
                                        <button
                                            type="button"
                                            className="produto-carousel-arrow produto-carousel-arrow-left"
                                            onClick={irParaAnterior}
                                            aria-label="Foto anterior"
                                        >
                                            <span aria-hidden="true">&lt;</span>
                                        </button>
                                        <button
                                            type="button"
                                            className="produto-carousel-arrow produto-carousel-arrow-right"
                                            onClick={irParaProxima}
                                            aria-label="Próxima foto"
                                        >
                                            <span aria-hidden="true">&gt;</span>
                                        </button>
                                    </>
                                )}
                            </>
                        ) : (
                            <div className="produto-detail-placeholder">ACAPRA</div>
                        )}
                    </div>

                    {fotos.length > 1 && (
                        <div className="produto-carousel-dots" aria-label="Fotos do produto">
                            {fotos.map((foto, index) => (
                                <button
                                    type="button"
                                    key={foto}
                                    className={`produto-carousel-dot ${fotoIndex === index ? "active" : ""}`}
                                    onClick={() => selecionarFoto(index)}
                                    aria-label={`Ver foto ${index + 1} de ${produto.nome}`}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <div className="produto-summary">
                    <h1>{produto.nome}</h1>
                    <p className="detail-price">{formatarPreco(produto.preco)}</p>

                    <dl className="product-specs">
                        <div>
                            <dt>Tipo</dt>
                            <dd>{produto.tipo_display}</dd>
                        </div>
                        <div>
                            <dt>Estoque</dt>
                            <dd>{produto.estoque > 0 ? `${produto.estoque} disponível` : "Esgotado"}</dd>
                        </div>
                    </dl>

                    <a
                        className="interest-button"
                        href={linkWhatsApp}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Tenho interesse
                    </a>

                    {produto.descricao && (
                        <section className="description-panel">
                            <h2>Descrição</h2>
                            <p>{produto.descricao}</p>
                        </section>
                    )}
                </div>
            </section>
        </main>
    );
}

export default ProdutoDetail;

