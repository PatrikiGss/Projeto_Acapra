import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { useAdminAccess } from "../../hooks/useAdminAccess";
import EmptyState from "../../components/ui/EmptyState";
import ConfirmModal from "../../components/ui/ConfirmModal";
import EditorImagens from "../../components/ui/EditorImagens";
import { useEditorImagens } from "../../hooks/useEditorImagens";
import { getResponseItems } from "../../utils/collection";
import { getApiErrorMessage } from "../../utils/errorUtils";
import { excluirRecurso } from "../../utils/crud";
import { logError } from "../../utils/logger";
import "./Vendas.css";

const formVazio = {
    nome: "",
    descricao: "",
    tipo: "humano",
    preco: "",
    estoque: 0,
    ativo: true,
};

function Vendas() {
    const [produtos, setProdutos] = useState([]);
    const [tipo, setTipo] = useState("todos");
    const [ordenacao, setOrdenacao] = useState("recentes");
    const { podeEditar } = useAdminAccess("vendas");
    const [modalAberto, setModalAberto] = useState(false);
    const [modoFormulario, setModoFormulario] = useState("criar");
    const [produtoEditando, setProdutoEditando] = useState(null);
    const [formulario, setFormulario] = useState(formVazio);
    const editorImagens = useEditorImagens(4);
    const [salvando, setSalvando] = useState(false);
    const [erroFormulario, setErroFormulario] = useState("");
    const [erroAcao, setErroAcao] = useState("");
    const [produtoParaExclusao, setProdutoParaExclusao] = useState(null);

    const carregarProdutos = () => {
        api.get("/api/vendas/produtos/")
            .then((response) => setProdutos(getResponseItems(response.data)))
            .catch((error) => logError("Vendas", error));
    };

    useEffect(() => {
        carregarProdutos();
    }, []);

    const produtosFiltrados = useMemo(() => {
        const filtrados = produtos
            .filter((produto) => tipo === "todos" || produto.tipo === tipo);

        return [...filtrados].sort((a, b) => {
            if (ordenacao === "preco-menor") return Number(a.preco) - Number(b.preco);
            if (ordenacao === "preco-maior") return Number(b.preco) - Number(a.preco);
            if (ordenacao === "nome") return a.nome.localeCompare(b.nome);
            return b.id - a.id;
        });
    }, [produtos, tipo, ordenacao]);

    const formatarPreco = (preco) => {
        return Number(preco).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
        });
    };

    const getStatusProduto = (produto) => {
        if (produto.estoque <= 0) {
            return { label: "Esgotado", className: "sold-out" };
        }

        return null;
    };

    const abrirCriacao = () => {
        setModoFormulario("criar");
        setProdutoEditando(null);
        setFormulario(formVazio);
        editorImagens.reiniciar([]);
        setErroFormulario("");
        setModalAberto(true);
    };

    const abrirEdicao = (produto) => {
        setModoFormulario("editar");
        setProdutoEditando(produto);
        setFormulario({
            nome: produto.nome || "",
            descricao: produto.descricao || "",
            tipo: produto.tipo || "humano",
            preco: produto.preco ?? "",
            estoque: produto.estoque ?? 0,
            ativo: Boolean(produto.ativo ?? true),
        });
        editorImagens.reiniciar(produto.galeria || []);
        setErroFormulario("");
        setModalAberto(true);
    };

    const fecharModal = () => {
        setModalAberto(false);
        setProdutoEditando(null);
        setFormulario(formVazio);
        editorImagens.reiniciar([]);
        setErroFormulario("");
        setSalvando(false);
    };

    const extrairMensagemErro = (error) => {
        return getApiErrorMessage(error, "Não foi possível salvar o produto.");
    };

    const alterarCampo = (event) => {
        const { name, value, type, checked } = event.target;
        setFormulario((atual) => ({
            ...atual,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const enviarFormulario = async (event) => {
        event.preventDefault();
        setSalvando(true);
        setErroFormulario("");

        const payload = new FormData();
        payload.append("nome", formulario.nome);
        payload.append("descricao", formulario.descricao);
        payload.append("tipo", formulario.tipo);
        payload.append("preco", formulario.preco);
        payload.append("estoque", formulario.estoque);
        payload.append("ativo", formulario.ativo ? "true" : "false");

        editorImagens.anexarAoFormData(payload);

        try {
            if (modoFormulario === "editar" && produtoEditando) {
                await api.patch(`/api/vendas/produtos/${produtoEditando.id}/`, payload);
            } else {
                await api.post("/api/vendas/produtos/", payload);
            }

            await carregarProdutos();
            fecharModal();
        } catch (error) {
            setErroFormulario(extrairMensagemErro(error));
        } finally {
            setSalvando(false);
        }
    };

    const excluirProduto = async (produto) => {
        setProdutoParaExclusao(produto);
    };

    const confirmarExclusao = async () => {
        if (!produtoParaExclusao) return;
        setErroAcao("");
        await excluirRecurso(`/api/vendas/produtos/${produtoParaExclusao.id}/`, {
            aoRemover: () => setProdutos((lista) => lista.filter((p) => p.id !== produtoParaExclusao.id)),
            recarregar: carregarProdutos,
            aoErro: setErroAcao,
            mensagemErro: "Não foi possível excluir o produto.",
        });
        setProdutoParaExclusao(null);
    };

    const renderProductCard = (produto) => {
        const imagem = produto.foto || produto.fotos?.[0];
        const statusProduto = getStatusProduto(produto);

        if (!podeEditar) {
            return (
                <Link className="product-card" to={`/produtos/${produto.id}`} key={produto.id}>
                    {statusProduto && (
                        <span className={`product-status ${statusProduto.className}`}>
                            {statusProduto.label}
                        </span>
                    )}

                    <div className="product-card-image">
                        {imagem ? (
                            <img src={imagem} alt={produto.nome} width="640" height="640" />
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
            );
        }

        return (
            <article className="product-card product-card-admin" key={produto.id}>
                <div className="product-card-link">
                    <Link to={`/produtos/${produto.id}`} className="product-card-main-link">
                        {statusProduto && (
                            <span className={`product-status ${statusProduto.className}`}>
                                {statusProduto.label}
                            </span>
                        )}

                        <div className="product-card-image">
                            {imagem ? (
                                <img src={imagem} alt={produto.nome} width="640" height="640" />
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
                </div>

                <div className="product-admin-actions">
                    <button type="button" className="product-admin-button edit" onClick={() => abrirEdicao(produto)}>
                        Editar
                    </button>
                    <button type="button" className="product-admin-button delete" onClick={() => excluirProduto(produto)}>
                        Excluir
                    </button>
                </div>
            </article>
        );
    };

    return (
        <div className="vendas-page">
            <section className="vendas-content">
                <div className="vendas-heading">
                    <div className="vendas-heading-row">
                        <div>
                            <h1>Produtos</h1>
                            <p>Compre itens da ACAPRA e ajude no cuidado dos animais.</p>
                        </div>

                        {podeEditar && (
                            <button type="button" className="vendas-add-button" onClick={abrirCriacao}>
                                Adicionar produto
                            </button>
                        )}
                    </div>
                </div>

                <div className="vendas-toolbar" aria-label="Filtros de produtos">
                    <label>
                        Tipo
                        <select value={tipo} onChange={(event) => setTipo(event.target.value)}>
                            <option value="todos">Todos</option>
                            <option value="humano">Para pessoas</option>
                            <option value="pet">Para pets</option>
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
                    {produtosFiltrados.map((produto) => renderProductCard(produto))}

                    {produtosFiltrados.length === 0 && (
                        <EmptyState
                            title="Nenhum produto encontrado para estes filtros."
                            description="Ajuste os filtros ou cadastre novos produtos."
                        />
                    )}
                </div>

                {erroAcao && <p className="vendas-action-error">{erroAcao}</p>}
            </section>

            {modalAberto && (
                <div className="product-modal-backdrop" onClick={fecharModal}>
                    <div className="product-modal" onClick={(event) => event.stopPropagation()}>
                        <div className="product-modal-header">
                            <h2>{modoFormulario === "editar" ? "Editar produto" : "Adicionar produto"}</h2>
                            <button type="button" className="product-modal-close" onClick={fecharModal}>
                                Fechar
                            </button>
                        </div>

                        <form className="product-form" onSubmit={enviarFormulario}>
                            <div className="product-form-grid">
                                <label>
                                    Nome
                                    <input
                                        name="nome"
                                        value={formulario.nome}
                                        onChange={alterarCampo}
                                        required
                                    />
                                </label>

                                <label>
                                    Tipo
                                    <select name="tipo" value={formulario.tipo} onChange={alterarCampo}>
                                        <option value="humano">Para pessoas</option>
                                        <option value="pet">Para pets</option>
                                    </select>
                                </label>

                                <label>
                                    Preço
                                    <input
                                        name="preco"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formulario.preco}
                                        onChange={alterarCampo}
                                        required
                                    />
                                </label>

                                <label>
                                    Estoque
                                    <input
                                        name="estoque"
                                        type="number"
                                        step="1"
                                        min="0"
                                        value={formulario.estoque}
                                        onChange={alterarCampo}
                                        required
                                    />
                                </label>
                            </div>

                            <label className="product-form-full">
                                Descrição
                                <textarea
                                    name="descricao"
                                    rows="5"
                                    value={formulario.descricao}
                                    onChange={alterarCampo}
                                />
                            </label>

                            <div className="product-form-row">
                                <label className="product-form-check">
                                    <input
                                        name="ativo"
                                        type="checkbox"
                                        checked={formulario.ativo}
                                        onChange={alterarCampo}
                                    />
                                    Produto ativo
                                </label>
                            </div>

                            <EditorImagens api={editorImagens} label="Fotos do produto" />

                            {erroFormulario && (
                                <p className="product-form-error">{erroFormulario}</p>
                            )}

                            <div className="product-form-actions">
                                <button type="button" className="product-form-button secondary" onClick={fecharModal}>
                                    Cancelar
                                </button>
                                <button type="submit" className="product-form-button primary" disabled={salvando}>
                                    {salvando ? "Salvando..." : "Salvar"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmModal
                open={Boolean(produtoParaExclusao)}
                title="Excluir produto"
                message={`Tem certeza que deseja excluir "${produtoParaExclusao?.nome || ""}"?`}
                confirmLabel="Excluir"
                onClose={() => setProdutoParaExclusao(null)}
                onConfirm={confirmarExclusao}
            />
        </div>
    );
}

export default Vendas;
