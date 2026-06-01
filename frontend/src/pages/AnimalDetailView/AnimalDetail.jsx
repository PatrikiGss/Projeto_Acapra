import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../services/api";
import "./AnimalDetail.css";

function AnimalDetail() {
    const { id } = useParams();
    const [animal, setAnimal] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        setLoading(true);
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

    if (loading) {
        return (
            <main className="animal-detail-page">
                <div className="animal-detail-message">Carregando animal...</div>
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
                <div className="animal-detail-image">
                    <img
                        src={animal.foto || "/adocao-cachorro.png"}
                        alt={animal.nome_animal}
                    />
                </div>

                <div className="animal-detail-info">
                    <Link className="back-link" to="/adocao">Voltar para adoção</Link>

                    <span className="detail-eyebrow">Animal para adoção</span>
                    <h1>{animal.nome_animal}</h1>

                    <div className="detail-tags">
                        <span>{formatarTexto(animal.sexo)}</span>
                        <span>{formatarTexto(animal.especie)}</span>
                    </div>

                    {animal.descricao && (
                        <p className="detail-description">{animal.descricao}</p>
                    )}

                    <div className="detail-contact">
                        <strong>Doador</strong>
                        <span>{animal.nome_doador}</span>
                    </div>
                </div>
            </section>
        </main>
    );
}

export default AnimalDetail;
