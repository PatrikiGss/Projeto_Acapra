import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./Adocao.css";
import api, { getMediaURL } from "../../services/api";
import { useAdminAccess } from "../../hooks/useAdminAccess";
import { formatBrazilianPhone, toBrazilianPhoneE164 } from "../../utils/phone";
import EmptyState from "../../components/ui/EmptyState";
import ConfirmModal from "../../components/ui/ConfirmModal";
import { getResponseItems } from "../../utils/collection";
import { getApiErrorMessage } from "../../utils/errorUtils";
import { excluirRecurso } from "../../utils/crud";
import { logError } from "../../utils/logger";
import { useEditorImagens } from "../../hooks/useEditorImagens";
import EditorImagens from "../../components/ui/EditorImagens";
import SocialCropPreview from "../../components/ui/SocialCropPreview";
import { usePaginacao } from "../../hooks/usePaginacao";
import Paginacao from "../../components/ui/Paginacao";

const formVazio = {
    nome_animal: "",
    nome_doador: "",
    telefone: "",
    especie: "cachorro",
    sexo: "macho",
    descricao: "",
    disponivel: true,
};

const SOCIAL_PUBLISH_TIMEOUT = 180000;

function Adocao() {
    const [animais, setAnimais] = useState([]);
    const [filtroEspecie, setFiltroEspecie] = useState("todos");
    const { podeEditar } = useAdminAccess("adocao");
    const [modalAberto, setModalAberto] = useState(false);
    const [modoFormulario, setModoFormulario] = useState("criar");
    const [animalEditando, setAnimalEditando] = useState(null);
    const [formulario, setFormulario] = useState(formVazio);
    const editorImagens = useEditorImagens(4);
    const [salvando, setSalvando] = useState(false);
    const [erroFormulario, setErroFormulario] = useState("");
    const [sucessoFormulario, setSucessoFormulario] = useState("");
    const [publicarRedes, setPublicarRedes] = useState(true);
    const [publicarFeed, setPublicarFeed] = useState(true);
    const [publicarStory, setPublicarStory] = useState(true);
    const [fotoFoco, setFotoFoco] = useState({ x: 0.5, y: 0.5 });
    const [erroAcao, setErroAcao] = useState("");
    const [animalParaExclusao, setAnimalParaExclusao] = useState(null);
    const [acoesAdminAbertas, setAcoesAdminAbertas] = useState(null);
    const fecharModalTimeoutRef = useRef(null);

    const carregarAnimais = () => {
        return api.get("/api/adocao/animais/")
            .then((response) => setAnimais(getResponseItems(response.data)))
            .catch((error) => logError("Adocao", error));
    };

    useEffect(() => {
        carregarAnimais();
    }, []);

    useEffect(() => {
        return () => {
            if (fecharModalTimeoutRef.current) {
                clearTimeout(fecharModalTimeoutRef.current);
            }
        };
    }, []);

    const { totalDisponiveis, totalAdotados } = useMemo(() => ({
        totalDisponiveis: animais.filter((a) => a.disponivel !== false).length,
        totalAdotados: animais.filter((a) => a.disponivel === false).length,
    }), [animais]);

    const animaisFiltrados = useMemo(() => {
        if (filtroEspecie === "adotados") {
            return animais.filter((a) => a.disponivel === false);
        }

        let lista = filtroEspecie === "todos"
            ? [...animais]
            : animais.filter((a) => a.especie === filtroEspecie);

        return lista.sort((a, b) => {
            if (a.disponivel === b.disponivel) return 0;
            return a.disponivel ? -1 : 1;
        });
    }, [animais, filtroEspecie]);

    const { pagina, setPagina, totalPaginas, itensPagina } = usePaginacao(animaisFiltrados, 12);

    const formatarTexto = (texto) => {
        if (!texto) return "";
        return texto.charAt(0).toUpperCase() + texto.slice(1);
    };

    const abrirCriacao = () => {
        if (fecharModalTimeoutRef.current) clearTimeout(fecharModalTimeoutRef.current);
        setModoFormulario("criar");
        setAnimalEditando(null);
        setFormulario(formVazio);
        setFotoFoco({ x: 0.5, y: 0.5 });
        editorImagens.reiniciar([]);
        setErroFormulario("");
        setSucessoFormulario("");
        setModalAberto(true);
    };

    const abrirEdicao = (animal) => {
        if (fecharModalTimeoutRef.current) clearTimeout(fecharModalTimeoutRef.current);
        setModoFormulario("editar");
        setAnimalEditando(animal);
        setFormulario({
            nome_animal: animal.nome_animal || "",
            nome_doador: animal.nome_doador || "",
            telefone: formatBrazilianPhone(animal.telefone || ""),
            especie: animal.especie || "cachorro",
            sexo: animal.sexo || "macho",
            descricao: animal.descricao || "",
            disponivel: animal.disponivel !== false,
        });
        editorImagens.reiniciar(animal.galeria || []);
        setFotoFoco({ x: animal.foto_foco_x ?? 0.5, y: animal.foto_foco_y ?? 0.5 });
        setErroFormulario("");
        setSucessoFormulario("");
        setModalAberto(true);
    };

    const fecharModal = () => {
        if (fecharModalTimeoutRef.current) {
            clearTimeout(fecharModalTimeoutRef.current);
            fecharModalTimeoutRef.current = null;
        }

        setModalAberto(false);
        setAnimalEditando(null);
        setFormulario(formVazio);
        setFotoFoco({ x: 0.5, y: 0.5 });
        editorImagens.reiniciar([]);
        setErroFormulario("");
        setSucessoFormulario("");
        setSalvando(false);
    };

    const extrairMensagemErro = (error) => {
        return getApiErrorMessage(error, "Não foi possível salvar o animal.");
    };

    const mensagemResultadoRedes = (resultado) => {
        if (!resultado) return "Animal salvo no site.";

        const statusDaRede = (rede) => {
            if (!rede?.tentativas) return "não foi publicado";
            if (rede.sucessos && rede.falhas) return "foi publicado parcialmente";
            return rede.sucessos ? "foi publicado" : "não foi publicado";
        };

        return `Animal salvo no site. No Facebook ${statusDaRede(resultado.facebook)} e no Instagram ${statusDaRede(resultado.instagram)}.`;
    };

    const alterarCampo = (event) => {
        const { name, value, type, checked } = event.target;
        setFormulario((atual) => ({
            ...atual,
            [name]:
                type === "checkbox"
                    ? checked
                    : name === "telefone"
                        ? formatBrazilianPhone(value)
                        : value,
        }));
    };

    const enviarFormulario = async (event) => {
        event.preventDefault();
        setSalvando(true);
        setErroFormulario("");
        setSucessoFormulario("");

        const payload = new FormData();
        payload.append("nome_animal", formulario.nome_animal);
        payload.append("nome_doador", formulario.nome_doador);
        payload.append("telefone", toBrazilianPhoneE164(formulario.telefone));
        payload.append("especie", formulario.especie);
        payload.append("sexo", formulario.sexo);
        payload.append("descricao", formulario.descricao);
        payload.append("disponivel", formulario.disponivel ? "true" : "false");
        payload.append("foto_foco_x", String(fotoFoco.x));
        payload.append("foto_foco_y", String(fotoFoco.y));

        editorImagens.anexarAoFormData(payload);

        const ehCriacao = !(modoFormulario === "editar" && animalEditando);
        if (ehCriacao) {
            payload.append("publicar_redes", publicarRedes ? "true" : "false");
            payload.append("publicar_feed", publicarFeed ? "true" : "false");
            payload.append("publicar_story", publicarStory ? "true" : "false");
        }

        try {
            let response;
            if (!ehCriacao) {
                response = await api.patch(`/api/adocao/animais/${animalEditando.id}/`, payload);
            } else {
                response = await api.post("/api/adocao/animais/", payload, {
                    timeout: SOCIAL_PUBLISH_TIMEOUT,
                });
            }
            await carregarAnimais();
            setSucessoFormulario(
                ehCriacao
                    ? mensagemResultadoRedes(response.data?.publicacao_redes)
                    : "Animal atualizado com sucesso!"
            );
            fecharModalTimeoutRef.current = setTimeout(() => fecharModal(), 2500);
        } catch (error) {
            setErroFormulario(extrairMensagemErro(error));
        } finally {
            setSalvando(false);
        }
    };

    const excluirAnimal = async (animal) => {
        setAnimalParaExclusao(animal);
    };

    const confirmarExclusao = async () => {
        if (!animalParaExclusao) return;
        setErroAcao("");
        await excluirRecurso(`/api/adocao/animais/${animalParaExclusao.id}/`, {
            aoRemover: () => setAnimais((lista) => lista.filter((a) => a.id !== animalParaExclusao.id)),
            recarregar: carregarAnimais,
            aoErro: setErroAcao,
            mensagemErro: "Não foi possível excluir o animal.",
        });
        setAnimalParaExclusao(null);
    };

    const renderAdotadoBadge = () => (
        <span className="animal-adotado-badge">Adotado</span>
    );

    const renderAnimalCard = (animal) => {
        const imagem = animal.foto || animal.fotos?.[0];
        const adotado = animal.disponivel === false;
        const fotoPosition = `${(animal.foto_foco_x ?? 0.5) * 100}% ${(animal.foto_foco_y ?? 0.5) * 100}%`;

        if (!podeEditar) {
            return (
                <Link
                    className={`animal-card${adotado ? " adotado" : ""}`}
                    to={`/adocao/${animal.id}`}
                    key={animal.id}
                >
                    <div className="animal-card-image">
                        {imagem ? (
                            <img
                                src={getMediaURL(imagem)}
                                alt={animal.nome_animal}
                                width="640"
                                height="480"
                                style={{ objectPosition: fotoPosition }}
                            />
                        ) : (
                            <div className="animal-placeholder">ACAPRA</div>
                        )}
                        {adotado && renderAdotadoBadge()}
                    </div>
                    <div className="animal-card-info">
                        <div className="animal-tags">
                            <span>{formatarTexto(animal.sexo)}</span>
                            <span>{formatarTexto(animal.especie)}</span>
                        </div>
                        <h2 className="name">{animal.nome_animal}</h2>
                        <p className="owner">Doador: {animal.nome_doador}</p>
                        <span className="animal-card-cta">
                            {adotado ? "Ver detalhes" : "Ver animal"}
                        </span>
                    </div>
                </Link>
            );
        }

        return (
            <article className={`animal-card animal-card-admin${adotado ? " adotado" : ""}`} key={animal.id}>
                <div className="animal-card-link">
                    <Link to={`/adocao/${animal.id}`} className="animal-card-main-link">
                        <div className="animal-card-image">
                            {imagem ? (
                                <img
                                    src={getMediaURL(imagem)}
                                    alt={animal.nome_animal}
                                    width="640"
                                    height="480"
                                    style={{ objectPosition: fotoPosition }}
                                />
                            ) : (
                                <div className="animal-placeholder">ACAPRA</div>
                            )}
                            {adotado && renderAdotadoBadge()}
                        </div>
                        <div className="animal-card-info">
                            <div className="animal-tags">
                                <span>{formatarTexto(animal.sexo)}</span>
                                <span>{formatarTexto(animal.especie)}</span>
                            </div>
                            <h2 className="name">{animal.nome_animal}</h2>
                            <p className="owner">Doador: {animal.nome_doador}</p>
                            <span className="animal-card-cta">Ver animal</span>
                        </div>
                    </Link>
                </div>

                <div className={`animal-admin-actions${acoesAdminAbertas === animal.id ? " is-open" : ""}`}>
                    <button
                        type="button"
                        className="animal-admin-toggle"
                        onClick={() => setAcoesAdminAbertas((atual) => atual === animal.id ? null : animal.id)}
                        aria-label="Mostrar ações do animal"
                        aria-expanded={acoesAdminAbertas === animal.id}
                    >
                        +
                    </button>
                    <button type="button" className="animal-admin-button edit" onClick={() => abrirEdicao(animal)}>
                        Editar
                    </button>
                    <button type="button" className="animal-admin-button delete" onClick={() => excluirAnimal(animal)}>
                        Excluir
                    </button>
                </div>
            </article>
        );
    };

    return (
        <div className="adocao-page">
            <section className="adocao-content">
                <div className="adocao-heading">
                    <div className="adocao-heading-row">
                        <div>
                            <h1>Encontre seu novo amigo!</h1>
                            <p>Conheça nossos animais disponíveis para adoção.</p>
                            <div className="adocao-stats">
                                <span className="adocao-stat">
                                    <strong>{totalDisponiveis}</strong> disponíveis
                                </span>
                                <span className="adocao-stat-divider" aria-hidden="true" />
                                <span className="adocao-stat adotados">
                                    <strong>{totalAdotados}</strong> adotados
                                </span>
                            </div>
                        </div>

                        {podeEditar && (
                            <button type="button" className="adocao-add-button" onClick={abrirCriacao}>
                                Adicionar animal
                            </button>
                        )}
                    </div>
                </div>

                <div className="adocao-toolbar" aria-label="Filtros de animais">
                    <button
                        className={filtroEspecie === "todos" ? "active" : ""}
                        type="button"
                        onClick={() => setFiltroEspecie("todos")}
                    >
                        Todos
                    </button>
                    <button
                        className={filtroEspecie === "cachorro" ? "active" : ""}
                        type="button"
                        onClick={() => setFiltroEspecie("cachorro")}
                    >
                        Cães
                    </button>
                    <button
                        className={filtroEspecie === "gato" ? "active" : ""}
                        type="button"
                        onClick={() => setFiltroEspecie("gato")}
                    >
                        Gatos
                    </button>
                    <button
                        className={filtroEspecie === "outros" ? "active" : ""}
                        type="button"
                        onClick={() => setFiltroEspecie("outros")}
                    >
                        Outros
                    </button>
                    <span className="adocao-toolbar-divider" aria-hidden="true" />
                    <button
                        className={`adotados-filter${filtroEspecie === "adotados" ? " active" : ""}`}
                        type="button"
                        onClick={() => setFiltroEspecie("adotados")}
                    >
                        Adotados
                    </button>
                </div>

                <div className="animals">
                    {itensPagina.map((animal) => renderAnimalCard(animal))}

                    {animaisFiltrados.length === 0 && (
                        <EmptyState
                            title={
                                filtroEspecie === "adotados"
                                    ? "Nenhum animal adotado ainda."
                                    : "Nenhum animal encontrado para este filtro."
                            }
                            description={
                                filtroEspecie === "adotados"
                                    ? "Os animais adotados aparecerão aqui."
                                    : "Tente selecionar outra espécie ou cadastre um novo animal."
                            }
                        />
                    )}
                </div>

                <Paginacao pagina={pagina} totalPaginas={totalPaginas} onMudar={setPagina} />

                {erroAcao && <p className="adocao-action-error">{erroAcao}</p>}
            </section>

            {modalAberto && (
                <div className="product-modal-backdrop" onClick={salvando || sucessoFormulario ? undefined : fecharModal}>
                    <div className="product-modal" onClick={(event) => event.stopPropagation()}>
                        <div className="product-modal-header">
                            <h2>{modoFormulario === "editar" ? "Editar animal" : "Adicionar animal"}</h2>
                            <button
                                type="button"
                                className="product-modal-close product-modal-close--icon"
                                onClick={fecharModal}
                                aria-label="Fechar modal"
                                title="Fechar"
                                disabled={salvando}
                            >
                                ×
                            </button>
                        </div>

                        {salvando && (
                            <div className="product-form-loading">
                                <div className="product-form-spinner" />
                                <p>
                                    {publicarRedes && modoFormulario !== "editar"
                                        ? "Salvando e publicando nas redes sociais..."
                                        : "Salvando..."}
                                </p>
                            </div>
                        )}

                        {!salvando && sucessoFormulario && (
                            <div className="product-form-success">
                                <span className="product-form-success-icon">✓</span>
                                <p>{sucessoFormulario}</p>
                            </div>
                        )}

                        {!salvando && !sucessoFormulario && (
                        <form className="product-form" onSubmit={enviarFormulario}>
                            <div className="product-form-grid">
                                <label>
                                    Nome do animal
                                    <input
                                        name="nome_animal"
                                        value={formulario.nome_animal}
                                        onChange={alterarCampo}
                                        required
                                    />
                                </label>

                                <label>
                                    Nome do doador
                                    <input
                                        name="nome_doador"
                                        value={formulario.nome_doador}
                                        onChange={alterarCampo}
                                        required
                                    />
                                </label>
                                <label>
                                    Telefone(+55)
                                    <input
                                        name="telefone"
                                        value={formulario.telefone}
                                        onChange={alterarCampo}
                                        placeholder="(49) 99999-9999"
                                        autoComplete="tel"
                                        required
                                    />
                                </label>

                                <label>
                                    Espécie
                                    <select name="especie" value={formulario.especie} onChange={alterarCampo}>
                                        <option value="cachorro">Cachorro</option>
                                        <option value="gato">Gato</option>
                                        <option value="outros">Outros</option>
                                    </select>
                                </label>

                                <label>
                                    Sexo
                                    <select name="sexo" value={formulario.sexo} onChange={alterarCampo}>
                                        <option value="macho">Macho</option>
                                        <option value="femea">Fêmea</option>
                                        <option value="ambos">Ambos</option>
                                    </select>
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
                                        name="disponivel"
                                        type="checkbox"
                                        checked={formulario.disponivel}
                                        onChange={alterarCampo}
                                    />
                                    Animal disponível para adoção
                                </label>

                                {modoFormulario !== "editar" && (
                                    <>
                                        <label className="product-form-check product-form-check--redes">
                                            <input
                                                type="checkbox"
                                                checked={publicarRedes}
                                                onChange={(e) => setPublicarRedes(e.target.checked)}
                                            />
                                            Publicar no Facebook / Instagram
                                        </label>

                                        {publicarRedes && (
                                            <div className="product-form-redes-destinos">
                                                <label className="product-form-check">
                                                    <input
                                                        type="checkbox"
                                                        checked={publicarFeed}
                                                        onChange={(e) => setPublicarFeed(e.target.checked)}
                                                    />
                                                    Feed
                                                </label>
                                                <label className="product-form-check">
                                                    <input
                                                        type="checkbox"
                                                        checked={publicarStory}
                                                        onChange={(e) => setPublicarStory(e.target.checked)}
                                                    />
                                                    Story
                                                </label>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            <EditorImagens api={editorImagens} label="Fotos do animal" />
                            <SocialCropPreview
                                imageUrl={editorImagens.novas[0]?.preview || animalEditando?.foto || null}
                                focusX={fotoFoco.x}
                                focusY={fotoFoco.y}
                                onChange={setFotoFoco}
                            />

                            {erroFormulario && (
                                <p className="product-form-error">{erroFormulario}</p>
                            )}

                            <div className="product-form-actions">
                                <button type="button" className="product-form-button secondary" onClick={fecharModal} disabled={salvando}>
                                    Cancelar
                                </button>
                                <button type="submit" className="product-form-button primary" disabled={salvando}>
                                    {salvando ? "Salvando..." : "Salvar"}
                                </button>
                            </div>
                        </form>
                        )}
                    </div>
                </div>
            )}

            <ConfirmModal
                open={Boolean(animalParaExclusao)}
                title="Excluir animal"
                message={`Tem certeza que deseja excluir "${animalParaExclusao?.nome_animal || ""}"?`}
                confirmLabel="Excluir"
                onClose={() => setAnimalParaExclusao(null)}
                onConfirm={confirmarExclusao}
            />
        </div>
    );
}

export default Adocao;
