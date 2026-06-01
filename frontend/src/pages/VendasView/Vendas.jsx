import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import "./Vendas.css";

function Vendas() {
    const [produtos, setProdutos] = useState([]);
    const [tipo, setTipo] = useState("todos");
    const [estoque, setEstoque] = useState("todos");
    const [ordenacao, setOrdenacao] = useState("recentes");

    useEffect(() => {
        api.get("/api/vendas/produtos/")
            .then((response) => setProdutos(response.data))
            .catch((error) => console.error(error));
    }, []);

    const produtosFiltrados = useMemo(() => {
        const filtrados = produtos
            .filter((produto) => tipo === "todos" || produto.tipo === tipo)
            .filter((produto) => {
                if (estoque === "todos") return true;
                if (estoque === "disponivel") return produto.estoque > 0;
                return produto.estoque <= 0;
            });

        return [...filtrados].sort((a, b) => {
            if (ordenacao === "preco-menor") return Number(a.preco) - Number(b.preco);
            if (ordenacao === "preco-maior") return Number(b.preco) - Number(a.preco);
            if (ordenacao === "nome") return a.nome.localeCompare(b.nome);
            return b.id - a.id;
        });
    }, [produtos, tipo, estoque, ordenacao]);

    const formatarPreco = (preco) => {
        return Number(preco).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
        });
    };

    return (
        <div className="vendas-page">
            <section className="vendas-content">
                <div className="vendas-heading">
                    <h1>Produtos</h1>
                    <p>Compre itens da ACAPRA e ajude no cuidado dos animais.</p>
                </div>

                <div className="vendas-toolbar" aria-label="Filtros de produtos">
                    <label>
                        Tipo
                        <select value={tipo} onChange={(event) => setTipo(event.target.value)}>
                            <option value="todos">Todos</option>
                            <option value="humano">Vestuário humano</option>
                            <option value="pet">Vestuário para pet</option>
                        </select>
                    </label>

                    <label>
                        Estoque
                        <select value={estoque} onChange={(event) => setEstoque(event.target.value)}>
                            <option value="todos">Todos</option>
                            <option value="disponivel">Disponíveis</option>
                            <option value="esgotado">Esgotados</option>
                        </select>
                    </label>

                    <label>
                        Ordenar
                        <select value={ordenacao} onChange={(event) => setOrdenacao(event.target.value)}>
                            <option value="recentes">Mais recentes</option>
                            <option value="preco-menor">Menor preço</option>
                            <option value="preco-maior">Maior preço</option>
                            <option value="nome">Nome</option>
                        </select>
                    </label>
                </div>

                <div className="products">
                    {produtosFiltrados.map((produto) => (
                        <Link className="product-card" to={`/produtos/${produto.id}`} key={produto.id}>
                            <span className={`product-status ${produto.estoque > 0 ? "available" : "sold-out"}`}>
                                {produto.estoque > 0 ? "Disponível" : "Esgotado"}
                            </span>

                            <div className="product-card-image">
                                {produto.foto ? (
                                    <img src={produto.foto} alt={produto.nome} />
                                ) : (
                                    <div className="product-placeholder">ACAPRA</div>
                                )}
                            </div>

                            <div className="product-card-info">
                                <div className="product-tags">
                                    <span>{produto.tipo_display}</span>
                                </div>
                                <h2 className="name">{produto.nome}</h2>
                                <p className="price">{formatarPreco(produto.preco)}</p>
                                <span className="product-action">Ver produto</span>
                            </div>
                        </Link>
                    ))}

                    {produtosFiltrados.length === 0 && (
                        <div className="empty-state">
                            Nenhum produto encontrado para estes filtros.
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

export default Vendas;
