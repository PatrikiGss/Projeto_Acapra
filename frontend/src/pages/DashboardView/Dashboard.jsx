import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import {
  getStoredUser,
  isLoggedIn,
  updateStoredUser,
} from "../../utils/auth";
import {
  getNivelLabel,
  isMaster,
  NIVEL_OPCOES,
  podeGerenciar,
  temAcessoDashboard,
} from "../../utils/permissions";
import { logError } from "../../utils/logger";
import "./Dashboard.css";

const MODULOS_RAPIDOS = [
  { id: "doacoes", titulo: "Doações", descricao: "Gerenciar dados PIX e QR Code", rota: "/doe" },
  { id: "adocao", titulo: "Adoção", descricao: "Cadastrar e editar animais", rota: "/adocao" },
  { id: "noticias", titulo: "Notícias", descricao: "Publicar novidades", rota: "/noticias" },
  { id: "resgates", titulo: "Resgates", descricao: "Registrar resgates", rota: "/resgates" },
  { id: "campanhas", titulo: "Campanhas", descricao: "Gerenciar campanhas", rota: "/campanhas" },
  { id: "vendas", titulo: "Produtos", descricao: "Gerenciar loja solidária", rota: "/produtos" },
  { id: "voluntariado", titulo: "Voluntários", descricao: "Ver cadastros do Faça Parte", rota: "/voluntariado" },
  { id: "denuncias", titulo: "Denúncias", descricao: "Ver denúncias recebidas", rota: "/denuncias" },
];

function Dashboard() {
  const [usuario, setUsuario] = useState(getStoredUser());
  const [dashboard, setDashboard] = useState(null);
  const [usuariosAdmin, setUsuariosAdmin] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [salvandoId, setSalvandoId] = useState(null);
  const [mensagem, setMensagem] = useState("");
  const [metaConnections, setMetaConnections] = useState([]);
  const [iniciandoMeta, setIniciandoMeta] = useState(false);

  useEffect(() => {
    let cancelado = false;

    const carregarDados = async () => {
      if (!isLoggedIn()) {
        if (!cancelado) setLoading(false);
        return;
      }

      if (!cancelado) {
        setLoading(true);
        setErro("");
      }

      try {
        const perfilRes = await api.get("/api/gerenciamento/user/me/");
        if (cancelado) return;

        const userData = perfilRes.data;
        setUsuario(userData);
        updateStoredUser(userData);

        if (!temAcessoDashboard(userData)) {
          return;
        }

        const dashboardRes = await api.get("/api/gerenciamento/dashboard/");
        if (cancelado) return;

        setDashboard(dashboardRes.data);

        const metaRes = await api.get("/api/meta/status/");
        if (!cancelado) {
          setMetaConnections(metaRes.data.connections || []);
        }

        if (isMaster(userData)) {
          const usuariosRes = await api.get("/api/gerenciamento/admin/usuarios/");
          if (!cancelado) {
            setUsuariosAdmin(usuariosRes.data || []);
          }
        } else if (!cancelado) {
          setUsuariosAdmin([]);
        }
      } catch (requestError) {
        if (!cancelado) {
          logError("Dashboard", requestError);
          setErro("Não foi possível carregar o painel administrativo.");
        }
      } finally {
        if (!cancelado) {
          setLoading(false);
        }
      }
    };

    carregarDados();

    return () => {
      cancelado = true;
    };
  }, []);

  const modulosDisponiveis = useMemo(
    () => MODULOS_RAPIDOS.filter((modulo) => podeGerenciar(modulo.id, usuario)),
    [usuario],
  );

  const conectarFacebook = async () => {
    setIniciandoMeta(true);
    setErro("");
    try {
      const response = await api.post("/api/meta/auth/initiate/");
      window.location.href = response.data.auth_url;
    } catch {
      setErro("Não foi possível iniciar a conexão com o Facebook.");
      setIniciandoMeta(false);
    }
  };

  const desconectarMeta = async (id) => {
    setErro("");
    try {
      await api.delete(`/api/meta/disconnect/${id}/`);
      setMetaConnections((prev) => prev.filter((c) => c.id !== id));
      setMensagem("Conexão removida com sucesso.");
    } catch {
      setErro("Não foi possível remover a conexão.");
    }
  };

  const atualizarNivel = async (usuarioId, nivel) => {
    setSalvandoId(usuarioId);
    setMensagem("");
    setErro("");

    try {
      const response = await api.patch(
        `/api/gerenciamento/admin/usuarios/${usuarioId}/perfil/`,
        { nivel },
      );

      setUsuariosAdmin((listaAtual) =>
        listaAtual.map((item) => (item.id === usuarioId ? response.data : item)),
      );

      if (usuario?.id === usuarioId) {
        setUsuario(response.data);
        updateStoredUser(response.data);
      }

      setMensagem("Vínculo administrativo atualizado com sucesso.");
    } catch (requestError) {
      logError("Dashboard", requestError);
      const detalhe =
        requestError.response?.data?.nivel?.[0] ||
        requestError.response?.data?.non_field_errors?.[0] ||
        "Não foi possível atualizar o vínculo do usuário.";
      setErro(detalhe);
    } finally {
      setSalvandoId(null);
    }
  };

  if (loading) {
    return (
      <section className="dashboard-page">
        <div className="dashboard-container">
          <p className="dashboard-loading">Carregando painel...</p>
        </div>
      </section>
    );
  }

  if (!temAcessoDashboard(usuario)) {
    return (
      <section className="dashboard-page">
        <div className="dashboard-container">
          <div className="dashboard-empty">
            <h1>Acesso restrito</h1>
            <p>Seu usuário não possui vínculo administrativo na Acapra.</p>
            <Link to="/" className="dashboard-link-button">Voltar ao início</Link>
          </div>
        </div>
      </section>
    );
  }

  const estatisticas = dashboard?.estatisticas || {};

  return (
    <section className="dashboard-page">
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div>
            <p className="dashboard-eyebrow">Painel administrativo</p>
            <h1>Dashboard Acapra</h1>
            <p className="dashboard-subtitle">
              Olá, <strong>{usuario?.nome}</strong>. Você está conectado como{" "}
              <span className="dashboard-badge">
                {dashboard?.nivel_display || getNivelLabel(usuario?.perfil_admin?.nivel)}
              </span>
            </p>
          </div>
        </header>

        {mensagem && <p className="dashboard-message">{mensagem}</p>}
        {erro && <p className="dashboard-error">{erro}</p>}

        <section className="dashboard-stats">
          {estatisticas.usuarios !== undefined && (
            <article className="dashboard-stat-card">
              <span>Usuários</span>
              <strong>{estatisticas.usuarios}</strong>
            </article>
          )}
          {estatisticas.animais !== undefined && (
            <article className="dashboard-stat-card">
              <span>Animais</span>
              <strong>{estatisticas.animais}</strong>
            </article>
          )}
          {estatisticas.publicacoes !== undefined && (
            <article className="dashboard-stat-card">
              <span>Publicações</span>
              <strong>{estatisticas.publicacoes}</strong>
            </article>
          )}
          {estatisticas.produtos !== undefined && (
            <article className="dashboard-stat-card">
              <span>Produtos</span>
              <strong>{estatisticas.produtos}</strong>
            </article>
          )}
          {estatisticas.dados_pix !== undefined && (
            <article className="dashboard-stat-card">
              <span>Dados PIX</span>
              <strong>{estatisticas.dados_pix}</strong>
            </article>
          )}
          {estatisticas.voluntarios !== undefined && (
            <article className="dashboard-stat-card">
              <span>Voluntários</span>
              <strong>{estatisticas.voluntarios}</strong>
            </article>
          )}
        </section>

        <section className="dashboard-section">
          <div className="dashboard-section-header">
            <h2>Módulos disponíveis</h2>
            <p>Acesse rapidamente as áreas que seu perfil pode gerenciar.</p>
          </div>

          <div className="dashboard-modules">
            {modulosDisponiveis.map((modulo) => (
              <Link key={modulo.id} to={modulo.rota} className="dashboard-module-card">
                <h3>{modulo.titulo}</h3>
                <p>{modulo.descricao}</p>
              </Link>
            ))}
          </div>
        </section>

        {isMaster(usuario) && (
          <section className="dashboard-section">
            <div className="dashboard-section-header">
              <h2>Redes sociais</h2>
              <p>
                Publique automaticamente no Facebook e Instagram ao cadastrar
                um novo animal para adoção.
              </p>
            </div>

            {metaConnections.length > 0 ? (
              <div className="meta-connections-list">
                {metaConnections.map((conn) => (
                  <div key={conn.id} className="meta-connection-card">
                    <div className="meta-connection-info">
                      <strong>{conn.page_name}</strong>
                      {conn.instagram_id && (
                        <span className="meta-connection-badge">
                          Instagram vinculado
                        </span>
                      )}
                    </div>
                    <button
                      className="meta-connection-disconnect"
                      onClick={() => desconectarMeta(conn.id)}
                    >
                      Desconectar
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <button
                className="dashboard-btn-meta"
                onClick={conectarFacebook}
                disabled={iniciandoMeta}
              >
                {iniciandoMeta ? "Redirecionando..." : "Conectar Facebook"}
              </button>
            )}
          </section>
        )}

        {isMaster(usuario) && (
          <section className="dashboard-section">
            <div className="dashboard-section-header">
              <h2>Gerenciamento de vínculos</h2>
              <p>
                Como Diretor Acapra, você pode designar administradores e definir
                o nível de acesso de cada usuário.
              </p>
            </div>

            <div className="dashboard-table-wrapper">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>E-mail</th>
                    <th>Vínculo atual</th>
                    <th>Designar perfil</th>
                  </tr>
                </thead>
                <tbody>
                  {usuariosAdmin.map((item) => (
                    <tr key={item.id}>
                      <td>{item.nome}</td>
                      <td>{item.email}</td>
                      <td>
                        <span className="dashboard-badge dashboard-badge--table">
                          {item.perfil_admin?.nivel_display || "Usuário sem vínculo"}
                        </span>
                      </td>
                      <td>
                        <select
                          className="dashboard-select"
                          value={item.perfil_admin?.nivel || "usuario"}
                          disabled={salvandoId === item.id}
                          onChange={(event) => atualizarNivel(item.id, event.target.value)}
                        >
                          {NIVEL_OPCOES.map((opcao) => (
                            <option key={opcao.value} value={opcao.value}>
                              {opcao.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </section>
  );
}

export default Dashboard;
