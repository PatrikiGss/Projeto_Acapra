/**
 * Validação de uploads no cliente.
 *
 * Espelha as regras do backend Django (core/validators.py) para falhar cedo e
 * melhorar a UX: extensão, tipo MIME e tamanho. A validação definitiva continua
 * no servidor — esta é apenas a primeira barreira.
 */

const MB = 1024 * 1024;

export const MAX_IMAGE_SIZE = 5 * MB;
export const MAX_DOCUMENT_SIZE = 10 * MB;

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"];
const IMAGE_MIME = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

const DOCUMENT_EXTENSIONS = [...IMAGE_EXTENSIONS, "pdf"];
const DOCUMENT_MIME = [...IMAGE_MIME, "application/pdf"];

function getExtension(name = "") {
  const idx = name.lastIndexOf(".");
  return idx >= 0 ? name.slice(idx + 1).toLowerCase() : "";
}

function validate(file, { extensions, mimes, maxSize }) {
  if (!file) return null;

  const ext = getExtension(file.name);

  if (!ext || !extensions.includes(ext)) {
    return `Tipo de arquivo não permitido. Use: ${extensions.join(", ")}.`;
  }

  // Alguns navegadores não preenchem file.type; quando preenchem, validamos.
  if (file.type && !mimes.includes(file.type)) {
    return "O conteúdo do arquivo não corresponde a um tipo permitido.";
  }

  if (file.size > maxSize) {
    return `Arquivo muito grande. Tamanho máximo: ${Math.round(maxSize / MB)} MB.`;
  }

  return null;
}

/**
 * Valida um arquivo de imagem. Retorna mensagem de erro (string) ou null se OK.
 */
export function validateImageFile(file) {
  return validate(file, {
    extensions: IMAGE_EXTENSIONS,
    mimes: IMAGE_MIME,
    maxSize: MAX_IMAGE_SIZE,
  });
}

/**
 * Valida um documento (PDF ou imagem). Retorna mensagem de erro ou null.
 */
export function validateDocumentFile(file) {
  return validate(file, {
    extensions: DOCUMENT_EXTENSIONS,
    mimes: DOCUMENT_MIME,
    maxSize: MAX_DOCUMENT_SIZE,
  });
}

// Atributo accept recomendado para inputs (melhora a UX do seletor nativo).
export const IMAGE_ACCEPT = ".jpg,.jpeg,.png,.gif,.webp,image/jpeg,image/png,image/gif,image/webp";
export const DOCUMENT_ACCEPT = `${IMAGE_ACCEPT},.pdf,application/pdf`;

export default { validateImageFile, validateDocumentFile, IMAGE_ACCEPT, DOCUMENT_ACCEPT };
