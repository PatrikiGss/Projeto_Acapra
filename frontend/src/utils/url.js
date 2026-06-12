/**
 * Utilitários de URL seguros (anti open-redirect e anti `javascript:`).
 *
 * React não bloqueia esquemas perigosos em `href` (ex.: `javascript:`,
 * `data:`), então URLs vindas da API/usuário precisam ser validadas antes de
 * irem para um `<a href>`.
 */

// Esquemas externos permitidos em links.
const ALLOWED_EXTERNAL_SCHEMES = new Set(["http:", "https:", "mailto:", "tel:"]);

/**
 * Retorna a URL se for um link externo seguro; caso contrário, retorna null.
 * Bloqueia `javascript:`, `data:`, `vbscript:`, etc.
 */
export function safeExternalUrl(rawUrl) {
  if (typeof rawUrl !== "string") return null;

  const url = rawUrl.trim();
  if (!url) return null;

  // mailto:/tel: não passam pelo construtor URL de forma uniforme — trata à parte.
  const lower = url.toLowerCase();
  if (lower.startsWith("mailto:") || lower.startsWith("tel:")) {
    return url;
  }

  try {
    const parsed = new URL(url, window.location.origin);
    if (!ALLOWED_EXTERNAL_SCHEMES.has(parsed.protocol)) {
      return null;
    }
    // Bloqueia explicitamente esquemas perigosos mesmo que escapem ao parser.
    if (/^\s*(javascript|data|vbscript):/i.test(url)) {
      return null;
    }
    return parsed.href;
  } catch {
    return null;
  }
}

/**
 * Garante que um caminho de redirecionamento interno é seguro
 * (evita open redirect para domínios externos via `//evil.com`).
 * Retorna o caminho se for interno; senão, retorna o fallback.
 */
export function safeInternalPath(path, fallback = "/") {
  if (typeof path !== "string") return fallback;

  const value = path.trim();

  // Deve começar com uma única barra e não ser protocol-relative (//) nem conter esquema.
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return fallback;
  }

  if (/^\/?\s*[a-z][a-z0-9+.-]*:/i.test(value)) {
    return fallback;
  }

  return value;
}

export default { safeExternalUrl, safeInternalPath };
