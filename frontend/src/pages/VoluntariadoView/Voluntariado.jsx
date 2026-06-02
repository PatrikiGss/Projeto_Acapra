import { useState } from "react";
import api from "../../services/api";
import { formatBrazilianPhone, toBrazilianPhoneE164 } from "../../utils/phone";
import "./Voluntariado.css";

const initialForm = {
    nome: "",
    telefone: "",
    idade: "",
    email: "",
    motivo: "",
};

function Voluntariado() {
    const [form, setForm] = useState(initialForm);
    const [status, setStatus] = useState("");
    const [error, setError] = useState("");
    const [sending, setSending] = useState(false);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((current) => ({
            ...current,
            [name]: name === "telefone" ? formatBrazilianPhone(value) : value,
        }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        setSending(true);
        setStatus("");
        setError("");

        const payload = {
            ...form,
            telefone: toBrazilianPhoneE164(form.telefone),
            idade: Number(form.idade),
            email: form.email || null,
        };

        api.post("/api/voluntariado/voluntarios/", payload)
            .then((response) => {
                setStatus(response.data.detail || "Cadastro enviado com sucesso.");
                setForm(initialForm);
            })
            .catch((erro) => {
                const data = erro.response?.data;
                const message = data?.detail || "Não foi possível enviar o cadastro. Confira os dados e tente novamente.";
                setError(message);
                console.error(erro);
            })
            .finally(() => setSending(false));
    };

    return (
        <div className="voluntariado-page">
            <section className="voluntariado-content">
                <div className="voluntariado-heading">
                    <h1>Faça parte</h1>
                    <p>Preencha o formulário e seja um voluntário da ACAPRA</p>
                </div>

                <div className="voluntariado-layout">

                    <form className="voluntariado-form" onSubmit={handleSubmit}>
                        <label>
                            Nome completo
                            <input
                                name="nome"
                                type="text"
                                value={form.nome}
                                onChange={handleChange}
                                required
                                maxLength="200"
                            />
                        </label>

                        <div className="form-row">
                            <label>
                                Telefone
                                <input
                                    name="telefone"
                                    type="tel"
                                    value={form.telefone}
                                    onChange={handleChange}
                                    required
                                    inputMode="tel"
                                    autoComplete="tel-national"
                                    placeholder="(49) 99999-9999"
                                    maxLength="15"
                                />
                            </label>

                            <label>
                                Idade
                                <input
                                    name="idade"
                                    type="number"
                                    value={form.idade}
                                    onChange={handleChange}
                                    required
                                    min="0"
                                    max="150"
                                />
                            </label>
                        </div>

                        <label>
                            Email
                            <input
                                name="email"
                                type="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="Opcional"
                            />
                        </label>

                        <label>
                            Por que deseja ser voluntário?
                            <textarea
                                name="motivo"
                                value={form.motivo}
                                onChange={handleChange}
                                required
                                minLength="10"
                                rows="5"
                            />
                        </label>

                        {status && <p className="form-message success">{status}</p>}
                        {error && <p className="form-message error">{error}</p>}

                        <button type="submit" disabled={sending}>
                            {sending ? "Enviando..." : "Enviar cadastro"}
                        </button>
                    </form>
                </div>
            </section>
        </div>
    );
}

export default Voluntariado;
