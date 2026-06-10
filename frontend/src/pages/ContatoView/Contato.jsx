
import { use, useEffect, useState } from "react";
import "./Contato.css";

function Contato() {
    const [contato, setContato] = useState(null);

    useEffect(() => {
        fetch("http://localhost:8000/api/contatos")
            .then((res) => res.json)
            .then((data) => setContato(data[0]))
            .catch((err) => console.error(err));
    }, []);
    if(!contato)
        return <p>Carregando...</p>;

    return (
        <div className="contato-page">
            <section className="contato-content">
                <div className="contato-heading">
                    <h1>Números para Contato</h1>
                    <p>Contate a ACAPRA para diferentes serviços</p>
                </div>

                <div className="contato-layout">
                    <h2>Números de Telefone</h2>
                    <h3>Castrações</h3>
                    <p>{contato.telefone1}</p>
                    <h3>Doações</h3>
                    <p>{contato.telefone2}</p>
                    <h3>Financeiro</h3>
                    <p>{contato.telefone3}</p>
                    <h2>Redes Sociais</h2>
                    <h3>Instagram</h3>
                    <p>{contato.instagram_user}</p>
                    <h3>Facebook</h3>
                    <p>{contato.facebook_user}</p>
                    <h3>Email</h3>
                    <p>{contato.email}</p>

                </div>
            </section>

        </div>
    );
}

export default Contato;
