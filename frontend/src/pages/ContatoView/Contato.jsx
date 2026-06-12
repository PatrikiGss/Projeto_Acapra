import { useEffect, useState } from "react";
import api from "../../services/api";
import { isMaster } from "../../utils/permissions";
import { safeExternalUrl } from "../../utils/url";
import "./Contato.css";

function IconWhatsApp() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

function IconInstagram() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
    </svg>
  );
}

function IconFacebook() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

function IconEmail() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  );
}

function toWhatsAppHref(numero) {
  const digits = numero.replace(/\D/g, "");
  const num = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${num}`;
}

const WHATSAPP_CAMPOS = [
  { key: "whatsapp_castracoes", label: "Castrações" },
  { key: "whatsapp_doacoes",    label: "Doações"    },
  { key: "whatsapp_financeiro", label: "Financeiro" },
];

function Contato() {
  const [contato, setContato] = useState(null);
  const [erro, setErro] = useState("");
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({});
  const [salvando, setSalvando] = useState(false);
  const [erroSalvar, setErroSalvar] = useState("");

  const diretor = isMaster();

  useEffect(() => {
    api
      .get("/api/contato/")
      .then((res) => { setContato(res.data); setForm(res.data); })
      .catch(() => setErro("Não foi possível carregar as informações de contato."));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    setSalvando(true);
    setErroSalvar("");
    try {
      const res = await api.patch("/api/contato/", form);
      setContato(res.data);
      setForm(res.data);
      setEditando(false);
    } catch {
      setErroSalvar("Não foi possível salvar. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  };

  const whatsappsVisiveis = contato
    ? WHATSAPP_CAMPOS.filter((c) => contato[c.key])
    : [];

  // URLs de redes sociais são definidas por admin; valida o esquema (http/https)
  // antes de renderizar no href para impedir injeção de javascript:/data:.
  const instagramUrl = safeExternalUrl(contato?.instagram);
  const facebookUrl = safeExternalUrl(contato?.facebook);

  const redesVisiveis = contato
    ? [
        instagramUrl && { key: "instagram", label: "Instagram", href: instagramUrl, Icon: IconInstagram, cor: "instagram" },
        facebookUrl  && { key: "facebook",  label: "Facebook",  href: facebookUrl,  Icon: IconFacebook,  cor: "facebook"  },
        contato.email     && { key: "email",      label: "E-mail",    href: `mailto:${contato.email}`, Icon: IconEmail, cor: "email", valor: contato.email },
      ].filter(Boolean)
    : [];

  return (
    <div className="contato-page">
      <section className="contato-content">
        <div className="contato-heading-row">
          <div className="contato-heading">
            <h1>Contato</h1>
            <p>Fale com a ACAPRA. Estamos disponíveis para dúvidas sobre adoção, castrações, doações e parcerias.</p>
          </div>
          {diretor && contato && !editando && (
            <button className="contato-edit-btn" onClick={() => { setEditando(true); setErroSalvar(""); }}>
              Editar informações
            </button>
          )}
        </div>

        {erro && <p className="contato-erro">{erro}</p>}
        {!contato && !erro && <p className="contato-carregando">Carregando...</p>}

        {contato && !editando && (
          <div className="contato-grupos">
            {whatsappsVisiveis.length > 0 && (
              <div className="contato-grupo">
                <h2 className="contato-grupo-titulo">WhatsApp</h2>
                <div className="contato-wpp-grid">
                  {whatsappsVisiveis.map((c) => (
                    <a
                      key={c.key}
                      className="contato-wpp-card"
                      href={toWhatsAppHref(contato[c.key])}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className="contato-wpp-icon"><IconWhatsApp /></span>
                      <div>
                        <span className="contato-card-label">{c.label}</span>
                        <span className="contato-wpp-numero">{contato[c.key]}</span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {redesVisiveis.length > 0 && (
              <div className="contato-grupo">
                <h2 className="contato-grupo-titulo">Redes sociais e contato online</h2>
                <div className="contato-redes-grid">
                  {redesVisiveis.map(({ key, label, href, Icon, cor, valor }) => (
                    <a
                      key={key}
                      className={`contato-rede-card contato-rede-card--${cor}`}
                      href={href}
                      target={key !== "email" ? "_blank" : undefined}
                      rel="noopener noreferrer"
                    >
                      <span className="contato-rede-icon"><Icon /></span>
                      <span className="contato-rede-label">{label}</span>
                      {valor && <span className="contato-rede-valor">{valor}</span>}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {contato && editando && (
          <form className="contato-form" onSubmit={handleSalvar}>
            <p className="contato-form-desc">Deixe em branco os campos que não deseja exibir.</p>

            <div className="contato-form-group">
              <span className="contato-grupo-titulo">WhatsApp</span>
              {WHATSAPP_CAMPOS.map((c) => (
                <label key={c.key} className="contato-form-field">
                  <span>{c.label}</span>
                  <input name={c.key} type="tel" value={form[c.key] || ""} onChange={handleChange} placeholder="(49) 99999-9999" />
                </label>
              ))}
            </div>

            <div className="contato-form-group">
              <span className="contato-grupo-titulo">Redes sociais</span>
              <label className="contato-form-field">
                <span>Instagram — URL completa</span>
                <input name="instagram" type="url" value={form.instagram || ""} onChange={handleChange} placeholder="https://instagram.com/acapra" />
              </label>
              <label className="contato-form-field">
                <span>Facebook — URL completa</span>
                <input name="facebook" type="url" value={form.facebook || ""} onChange={handleChange} placeholder="https://facebook.com/acapra" />
              </label>
              <label className="contato-form-field">
                <span>E-mail</span>
                <input name="email" type="email" value={form.email || ""} onChange={handleChange} placeholder="contato@acapra.org.br" />
              </label>
            </div>

            {erroSalvar && <p className="contato-erro">{erroSalvar}</p>}

            <div className="contato-form-actions">
              <button type="button" className="contato-btn-cancelar" onClick={() => { setEditando(false); setForm(contato); }}>Cancelar</button>
              <button type="submit" className="contato-btn-salvar" disabled={salvando}>{salvando ? "Salvando..." : "Salvar"}</button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}

export default Contato;
