import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./Adocao.css";
import api, { getMediaURL } from "../../services/api";
import { useAdminAccess } from "../../hooks/useAdminAccess";
import { formatBrazilianPhone, toBrazilianPhoneE164 } from "../../utils/phone";
import EmptyState from "../../components/ui/EmptyState";
import ConfirmModal from "../../components/ui/ConfirmModal";
import { getResponseItems } from "../../utils/collection";
import { getApiErrorMessage } from "../../utils/errorUtils";
import { logError } from "../../utils/logger";
import { validateImageFile, IMAGE_ACCEPT } from "../../utils/upload";

const formVazio = {
    nome_animal: "",
    nome_doador: "",
    telefone: "",
    especie: "cachorro",
    sexo: "macho",
    descricao: "",
    disponivel: true,
};

function Adocao() {
    const [animais, setAnimais] = useState([]);
    const [filtroEspecie, setFiltroEspecie] = useState("todos");
    const { podeEditar } = useAdminAccess("adocao");
    const [modalAberto, setModalAberto] = useState(false);
    const [modoFormulario, setModoFormulario] = useState("criar");
    const [animalEditando, setAnimalEditando] = useState(null);
    const [formulario, setFormulario] = useState(formVazio);
    const [fotoPrincipal, setFotoPrincipal] = useState(null);
    const [previewFotoPrincipal, setPreviewFotoPrincipal] = useState("");
    const [fotosAdicionais, setFotosAdicionais] = useState([]);
    const [salvando, setSalvando] = useState(false);
    const [erroFormulario, setErroFormulario] = useState("");
    const [sucessoFormulario, setSucessoFormulario] = useState("");
    const [publicarRedes, setPublicarRedes] = useState(true);
    const [erroAcao, setErroAcao] = useState("");
    const [animalParaExclusao, setAnimalParaExclusao] = useState(null);

    const carregarAnimais = () => {
        api.get("/api/adocao/animais/")
            .then((response) => setAnimais(getResponseItems(response.data)))
            .catch((error) => logError("Adocao", error));
    };

    useEffect(() => {
        carregarAnimais();
    }, []);

    useEffect(() => {
        return () => {
            if (previewFotoPrincipal.startsWith("blob:")) {
                URL.revokeObjectURL(previewFotoPrincipal);
            }

            fotosAdicionais.forEach((foto) => {
                if (foto.preview.startsWith("blob:")) {
                    URL.revokeObjectURL(foto.preview);
                }
            });
        };
    }, [previewFotoPrincipal, fotosAdicionais]);

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

    const formatarTexto = (texto) => {
        if (!texto) return "";
        return texto.charAt(0).toUpperCase() + texto.slice(1);
    };

    const fotosAtuais = useMemo(() => {
        if (!animalEditando) return [];

        return [animalEditando.foto, ...(animalEditando.fotos || [])]
            .filter(Boolean)
            .map((foto) => getMediaURL(foto));
    }, [animalEditando]);

    const abrirCriacao = () => {
        setModoFormulario("criar");
        setAnimalEditando(null);
        setFormulario(formVazio);
        setFotoPrincipal(null);
        setFotosAdicionais([]);
        setErroFormulario("");
        if (previewFotoPrincipal.startsWith("blob:")) URL.revokeObjectURL(previewFotoPrincipal);
        fotosAdicionais.forEach((foto) => {
            if (foto.preview.startsWith("blob:")) {
                URL.revokeObjectURL(foto.preview);
            }
        });
        setPreviewFotoPrincipal("");
        setFotosAdicionais([]);
        setModalAberto(true);
    };

    const abrirEdicao = (animal) => {
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
        setFotoPrincipal(null);
        setFotosAdicionais([]);
        setErroFormulario("");
        if (previewFotoPrincipal.startsWith("blob:")) URL.revokeObjectURL(previewFotoPrincipal);
        fotosAdicionais.forEach((foto) => {
            if (foto.preview.startsWith("blob:")) {
                URL.revokeObjectURL(foto.preview);
            }
        });
        setPreviewFotoPrincipal("");
        setModalAberto(true);
    };

    const fecharModal = () => {
        if (previewFotoPrincipal.startsWith("blob:")) URL.revokeObjectURL(previewFotoPrincipal);
        fotosAdicionais.forEach((foto) => {
            if (foto.preview.startsWith("blob:")) {
                URL.revokeObjectURL(foto.preview);
            }
        });
        setModalAberto(false);
        setAnimalEditando(null);
        setFormulario(formVazio);
        setFotoPrincipal(null);
        setPreviewFotoPrincipal("");
        setFotosAdicionais([]);
        setErroFormulario("");
        setSalvando(false);
    };

    const extrairMensagemErro = (error) => {
        return getApiErrorMessage(error, "Não foi possível salvar o animal.");
    };

    const lidarComFotoPrincipal = (file) => {
        if (file) {
            const erroValidacao = validateImageFile(file);
            if (erroValidacao) {
                setErroFormulario(erroValidacao);
                return;
            }
        }
        setErroFormulario("");
        if (previewFotoPrincipal.startsWith("blob:")) URL.revokeObjectURL(previewFotoPrincipal);
        setFotoPrincipal(file || null);
        setPreviewFotoPrincipal(file ? URL.createObjectURL(file) : "");
    };

    const lidarComFotosAdicionais = (files) => {
        const lista = Array.from(files || []);

        if (lista.length > 10) {
            setErroFormulario("Selecione no máximo 10 imagens.");
            return;
        }

        for (const file of lista) {
            const erroValidacao = validateImageFile(file);
            if (erroValidacao) {
                setErroFormulario(erroValidacao);
                return;
            }
        }
        setErroFormulario("");

        fotosAdicionais.forEach((foto) => {
            if (foto.preview.startsWith("blob:")) {
                URL.revokeObjectURL(foto.preview);
            }
        });

        setFotosAdicionais(lista.map((file) => ({
            file,
            preview: URL.createObjectURL(file),
        })));
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

        if (fotoPrincipal) {
            payload.append("foto", fotoPrincipal);
        }

        fotosAdicionais.forEach((foto) => {
            payload.append("fotos", foto.file);
        });

        const ehCriacao = !(modoFormulario === "editar" && animalEditando);
        if (ehCriacao) {
            payload.append("publicar_redes", publicarRedes ? "true" : "false");
        }

        try {
            if (!ehCriacao) {
                await api.patch(`/api/adocao/animais/${animalEditando.id}/`, payload);
            } else {
                await api.post("/api/adocao/animais/", payload);
            }
            await carregarAnimais();
            setSucessoFormulario("Animal adicionado com sucesso!");
            setTimeout(() => fecharModal(), 2500);
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

        try {
            await api.delete(`/api/adocao/animais/${animalParaExclusao.id}/`);
            await carregarAnimais();
        } catch (error) {
            setErroAcao(getApiErrorMessage(error, "Não foi possível excluir o animal."));
        } finally {
            setAnimalParaExclusao(null);
        }
    };

    const renderAdotadoBadge = () => (
        <span className="animal-adotado-badge">Adotado</span>
    );

    const renderAnimalCard = (animal) => {
        const imagem = animal.foto || animal.fotos?.[0];
        const adotado = animal.disponivel === false;

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

                <div className="animal-admin-actions">
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
                    {animaisFiltrados.map((animal) => renderAnimalCard(animal))}

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

                {erroAcao && <p className="adocao-action-error">{erroAcao}</p>}
            </section>

            {modalAberto && (
                <div className="product-modal-backdrop" onClick={salvando || sucessoFormulario ? undefined : fecharModal}>
                    <div className="product-modal" onClick={(event) => event.stopPropagation()}>
                        <div className="product-modal-header">
                            <h2>{modoFormulario === "editar" ? "Editar animal" : "Adicionar animal"}</h2>
                            {!salvando && !sucessoFormulario && (
                                <button type="button" className="product-modal-close" onClick={fecharModal}>
                                    Fechar
                                </button>
                            )}
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
                                    Telefone do doador (+55)
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
                                <label className="product-form-upload">
                                    Foto principal
                                    <input
                                        type="file"
                                        accept={IMAGE_ACCEPT}
                                        onChange={(event) => lidarComFotoPrincipal(event.target.files?.[0] || null)}
                                    />
                                </label>

                                <label className="product-form-upload">
                                    Fotos adicionais
                                    <input
                                        type="file"
                                        accept={IMAGE_ACCEPT}
                                        multiple
                                        onChange={(event) => lidarComFotosAdicionais(event.target.files)}
                                    />
                                </label>

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
                                    <label className="product-form-check product-form-check--redes">
                                        <input
                                            type="checkbox"
                                            checked={publicarRedes}
                                            onChange={(e) => setPublicarRedes(e.target.checked)}
                                        />
                                        Publicar no Facebook / Instagram
                                    </label>
                                )}
                            </div>

                            {fotosAtuais.length > 0 && (
                                <div className="product-form-gallery">
                                    <p className="product-form-gallery-title">Fotos atuais</p>
                                    <div className="product-form-preview-grid">
                                        {fotosAtuais.map((foto) => (
                                            <div className="product-form-preview-item" key={foto}>
                                                <img src={foto} alt="Foto atual do animal" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {previewFotoPrincipal && (
                                <div className="product-form-gallery">
                                    <p className="product-form-gallery-title">Foto principal selecionada</p>
                                    <div className="product-form-preview-grid">
                                        <div className="product-form-preview-item">
                                            <img src={previewFotoPrincipal} alt="Pré-visualização da foto principal" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {fotosAdicionais.length > 0 && (
                                <div className="product-form-gallery">
                                    <p className="product-form-gallery-title">Fotos adicionais selecionadas</p>
                                    <div className="product-form-preview-grid">
                                        {fotosAdicionais.map((foto) => (
                                            <div className="product-form-preview-item" key={foto.preview}>
                                                <img src={foto.preview} alt="Pré-visualização de foto adicional" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

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
