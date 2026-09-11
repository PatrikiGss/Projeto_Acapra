import { IMAGE_ACCEPT } from "../../utils/upload";
import "./EditorImagens.css";

/**
 * UI padronizada de edição de imagens. Recebe a API do hook `useEditorImagens`
 * e renderiza: as imagens já cadastradas (com remoção individual), o seletor
 * para adicionar novas e os previews das novas imagens.
 */
function EditorImagens({ api, label = "Imagens" }) {
  const {
    limite,
    existentes,
    removidos,
    novas,
    erro,
    total,
    toggleRemover,
    adicionar,
    removerNova,
  } = api;

  const podeAdicionar = total < limite;

  return (
    <div className="editor-imagens">
      <div className="editor-imagens-head">
        <span className="editor-imagens-label">{label}</span>
        <small className="editor-imagens-contador">{total} de {limite}</small>
      </div>

      {existentes.length > 0 && (
        <div className="editor-imagens-grid">
          {existentes.map((item) => {
            const marcada = removidos.has(item.key);
            return (
              <div
                key={item.key}
                className={`editor-imagens-item${marcada ? " editor-imagens-item--removida" : ""}`}
              >
                <img src={item.url} alt="Imagem cadastrada" loading="lazy" />
                {item.tipo === "principal" && (
                  <span className="editor-imagens-badge">Principal</span>
                )}
                {marcada && <span className="editor-imagens-tag-removida">Será removida</span>}
                <button
                  type="button"
                  className={`editor-imagens-toggle${marcada ? " desfazer" : ""}`}
                  onClick={() => toggleRemover(item.key)}
                >
                  {marcada ? "Desfazer" : "Remover"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <label className={`editor-imagens-add${podeAdicionar ? "" : " disabled"}`}>
        <span>{podeAdicionar ? "Adicionar imagens" : `Limite de ${limite} imagens atingido`}</span>
        <input
          type="file"
          accept={IMAGE_ACCEPT}
          multiple
          disabled={!podeAdicionar}
          onChange={(event) => {
            adicionar(event.target.files);
            event.target.value = "";
          }}
        />
      </label>

      {novas.length > 0 && (
        <div className="editor-imagens-grid">
          {novas.map((nova) => (
            <div key={nova.key} className="editor-imagens-item editor-imagens-item--nova">
              <img src={nova.preview} alt="Nova imagem" />
              <span className="editor-imagens-badge nova">Nova</span>
              <button
                type="button"
                className="editor-imagens-toggle"
                onClick={() => removerNova(nova.key)}
              >
                Remover
              </button>
            </div>
          ))}
        </div>
      )}

      {erro && <p className="editor-imagens-erro">{erro}</p>}
    </div>
  );
}

export default EditorImagens;
