import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../services/api";
import "./ProdutoDetail.css";

function ProdutoDetail() {
    const { id } = useParams();
    const [produto, setProduto] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        setLoading(true);
        api.get(`/api/vendas/produtos/${id}/`)
            .then((response) => {
                setProduto(response.data);
                setError(false);
            })
            .catch((erro) => {
                console.error(erro);
                setError(true);
            })
            .finally(() => setLoading(false));
    }, [id]);

    const formatarPreco = (preco) => {
        return Number(preco).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
        });
    };

    if (loading) {
        return (
            <main className="produto-detail-page">
                <div className="produto-detail-message">Carregando produto...</div>
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
                    <div className="produto-thumb">
                        {produto.foto ? (
                            <img src={produto.foto} alt={produto.nome} />
                        ) : (
                            <span>ACAPRA</span>
                        )}
                    </div>

                    <div className="produto-main-image">
                        {produto.foto ? (
                            <img src={produto.foto} alt={produto.nome} />
                        ) : (
                            <div className="produto-detail-placeholder">ACAPRA</div>
                        )}
                    </div>
                </div>

                <div className="produto-summary">
                    
                    <h1>{produto.nome}</h1>
                    <p className="detail-code">Código #{String(produto.id).padStart(4, "0")}</p>

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

                    <button className="interest-button" type="button">
                        Tenho interesse
                    </button>

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
