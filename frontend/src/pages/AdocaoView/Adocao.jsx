import React, { useEffect, useState } from "react";
import "./Adocao.css";


const Adocao = () => {
    const [pets, setPets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnimals = async () => {
            try {
                const response = await fetch("http://localhost:8000/api/adocao/animais/");
                const data = await response.json();
                console.log(pet.foto);


                setPets(data);
            } catch (error) {
                console.error("Error fetching animals:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAnimals();
    }, []);

    return (
        <main className="container">
            <section id="adoptable-pets" className="pet-listings">
                <h2>Meet Our Adoptable Friends!</h2>

                {loading ? (
                    <p>Loading pets...</p>
                ) : (
                    <div className="pet-grid">
                        {pets.map((pet) => (
                            <div className="pet-card" key={pet.id}>
                                <img
                                    src={`http://localhost:8000${pet.foto}`}
                                    alt={pet.nome_animal}
                                />
                                <h3>{pet.nome_animal}</h3>
                                <p>{pet.especie}</p>
                                <p>{pet.sexo}</p>
                                <p>{pet.descricao}</p>
                            </div>
                        ))}
                    </div>
                )}
            </section>


        </main>
    );
};

export default Adocao;