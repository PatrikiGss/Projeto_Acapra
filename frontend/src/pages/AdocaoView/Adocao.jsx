import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Adocao.css";
import api from "../../services/api";

function Adocao() {
    const [animais, setAnimais] = useState([]);
    const [filtroEspecie, setFiltroEspecie] = useState("todos");

    useEffect(() => {
        api.get("/api/adocao/animais/")
            .then((response) => setAnimais(response.data))
            .catch((error) => console.error(error));
    }, []);

    const animaisFiltrados = filtroEspecie === "todos"
        ? animais
        : animais.filter((animal) => animal.especie === filtroEspecie);

    const formatarTexto = (texto) => {
        if (!texto) return "";
        return texto.charAt(0).toUpperCase() + texto.slice(1);
    };

    return (

        <div className="adocao-page">
            <section className="adocao-content">
                <div className="adocao-heading">
                    <h1>Encontre seu novo amigo</h1>
                    <p>Conheça os cães e gatos que estão esperando por uma família.</p>
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
                </div>

                <div className="animals">
                    {animaisFiltrados.map((animal) => (
                        <Link className="animal-card" to={`/adocao/${animal.id}`} key={animal.id}>
                            <div className="animal-card-image">
                                <img
                                    src={animal.foto || "/adocao-cachorro.png"}
                                    alt={animal.nome_animal}
                                />
                            </div>

                            <div className="animal-card-info">
                                <div className="animal-tags">
                                    <span>{formatarTexto(animal.sexo)}</span>
                                    <span>{formatarTexto(animal.especie)}</span>
                                </div>
                                <h2 className="name">{animal.nome_animal}</h2>
                                <p className="owner">Doador: {animal.nome_doador}</p>
                            </div>
                        </Link>
                    ))}

                    {animaisFiltrados.length === 0 && (
                        <div className="empty-state">
                            Nenhum animal encontrado para este filtro.
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

export default Adocao;
