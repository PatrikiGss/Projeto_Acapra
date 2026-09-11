import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { logError } from "../../utils/logger";
import "./Auditoria.css";

const ENDPOINT = "/api/auditoria/registros/";

function formatarDataHora(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatarAlteracoes(alteracoes) {
  if (!alteracoes || typeof alteracoes !== "object") return null;

  if (Array.isArray(alteracoes.campos_editados)) {
    return `Campos editados: ${alteracoes.campos_editados.join(", ")}`;
  }

  const partes = Object.entries(alteracoes).map(([campo, valor]) =>
    Array.isArray(valor) ? `${campo}: ${valor[0]} → ${valor[1]}` : `${campo}: ${valor}`,
  );
  return partes.join(" · ");
}

function paraCaminhoRelativo(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.pathname + parsed.search;
  } catch {
    return url;
  }
}

async function buscarPagina(url) {
  const { data } = await api.get(url);
  return data;
}

function mensagemDeErro(requestError) {
  return requestError.response?.status === 403
    ? "Acesso restrito. Apenas o Diretor Acapra pode consultar a auditoria."
    : "Não foi possível carregar os registros de auditoria.";
}

function Auditoria() {
  const [registros, setRegistros] = useState([]);
  const [proxima, setProxima] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;

    const carregarInicial = async () => {
      try {
        const data = await buscarPagina(ENDPOINT);
        if (!ativo) return;
        setRegistros(data.results);
        setProxima(paraCaminhoRelativo(data.next));
      } catch (requestError) {
        if (!ativo) return;
        logError("Auditoria", requestError);
        setErro(mensagemDeErro(requestError));
      } finally {
        if (ativo) setLoading(false);
      }
    };

    carregarInicial();
    return () => {
      ativo = false;
    };
  }, []);

  const carregarMais = async () => {
    try {
      const data = await buscarPagina(proxima);
      setRegistros((atuais) => [...atuais, ...data.results]);
      setProxima(paraCaminhoRelativo(data.next));
    } catch (requestError) {
      logError("Auditoria", requestError);
      setErro(mensagemDeErro(requestError));
    }
  };

  return (
    <section className="auditoria-page">
      <div className="auditoria-container">
        <h1 className="auditoria-titulo">Registros de auditoria</h1>
        <p className="auditoria-subtitulo">
          Trilha imutável de ações sensíveis. Não pode ser editada nem apagada.
        </p>

        {loading && <p className="auditoria-estado">Carregando registros...</p>}

        {!loading && erro && <p className="auditoria-estado auditoria-erro">{erro}</p>}

        {!loading && !erro && registros.length === 0 && (
          <p className="auditoria-estado">Nenhum registro de auditoria ainda.</p>
        )}

        {!loading && !erro && registros.length > 0 && (
          <ul className="auditoria-lista">
            {registros.map((registro) => {
              const alteracoes = formatarAlteracoes(registro.alteracoes);
              const autor =
                registro.usuario_nome || registro.usuario_email || "sistema";

              return (
                <li key={registro.id} className="auditoria-item">
                  <span className={`auditoria-acao auditoria-acao--${registro.acao}`}>
                    {registro.acao_display}
                  </span>
                  <strong className="auditoria-modelo">
                    {registro.modelo}
                    {registro.objeto_id ? ` #${registro.objeto_id}` : ""}
                  </strong>
                  {registro.descricao && (
                    <p className="auditoria-descricao">{registro.descricao}</p>
                  )}
                  {alteracoes && <p className="auditoria-alteracoes">{alteracoes}</p>}
                  <p className="auditoria-meta">
                    por <strong>{autor}</strong> em {formatarDataHora(registro.data_hora)}
                  </p>
                </li>
              );
            })}
          </ul>
        )}

        {!loading && !erro && proxima && (
          <button type="button" className="auditoria-mais" onClick={carregarMais}>
            Carregar mais
          </button>
        )}

        <Link to="/dashboard" className="auditoria-voltar">
          ← Voltar ao dashboard
        </Link>
      </div>
    </section>
  );
}

export default Auditoria;
