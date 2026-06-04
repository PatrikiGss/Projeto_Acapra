import { useEffect, useState } from "react";
import api from "../../services/api";
import "./Doe.css";

const bankFields = [
  ["Banco", "banco"],
  ["Agência", "agencia"],
  ["Conta", "conta"],
  ["Tipo", "tipo_conta"],
  ["CNPJ", "cnpj"],
  ["Favorecido", "favorecido"],
];

function Doe() {
  const [dadosDoacao, setDadosDoacao] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.get("/api/doacoes/pix/")
      .then((response) => {
        setDadosDoacao(response.data[0] || null);
        setError(false);
      })
      .catch((erro) => {
        console.error(erro);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  const hasBankData = dadosDoacao && bankFields.some(([, key]) => dadosDoacao[key]);

  return (
    <div className="doe-page">
      <section className="doe-header">
        <h1>Ajude a ACAPRA</h1>
        <p>
          {dadosDoacao?.descricao || "Use o PIX ou os dados bancários para fazer a sua doação."}
        </p>
      </section>

      {loading && (
        <div className="donation-message">Carregando dados de doação...</div>
      )}

      {!loading && error && (
        <div className="donation-message">Não foi possível carregar os dados de doação.</div>
      )}

      {!loading && !error && !dadosDoacao && (
        <div className="donation-message">Nenhum dado de doação ativo foi cadastrado.</div>
      )}

      {!loading && !error && dadosDoacao && (
        <section className="donation-grid" aria-label="Dados para doação">
          <article className="donation-card pix-card">
            <div>
              <span className="card-label">PIX</span>
              <h2>QR Code</h2>
            </div>

            <div className="qr-code-image">
              <img src={dadosDoacao.qr_code} alt="QR Code PIX da ACAPRA" />
            </div>

            <div className="pix-key-box">
              <strong>Chave PIX</strong>
              <span>{dadosDoacao.chave_pix}</span>
            </div>
          </article>

          <article className="donation-card bank-card">
            <span className="card-label">Dados bancários</span>
            <h2>Transferência</h2>

            {hasBankData ? (
              <dl className="bank-data">
                {bankFields.map(([label, key]) => (
                  <div key={key}>
                    <dt>{label}</dt>
                    <dd>{dadosDoacao[key] || "Não informado"}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="bank-empty">Dados bancários ainda não cadastrados.</p>
            )}
          </article>
        </section>
      )}
    </div>
  );
}

export default Doe;
