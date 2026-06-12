/**
 * Logger seguro para o frontend.
 *
 * Objetivos de segurança:
 *  - Nunca registrar tokens/JWT/segredos (objetos de erro do axios carregam o
 *    header Authorization em error.config.headers — logá-los vaza o token).
 *  - Não exibir detalhes internos em produção (silencioso por padrão).
 *  - Em desenvolvimento, registrar apenas uma mensagem segura e redigida.
 *
 * Use logError/logWarn em vez de console.* diretamente.
 */

const IS_DEV = Boolean(import.meta?.env?.DEV);

const SENSITIVE_KEY = /(authorization|token|access|refresh|password|senha|secret|api[_-]?key|cookie)/i;

function redact(value, depth = 0) {
  if (value == null || depth > 3) return value;

  if (typeof value === "string") {
    // Remove possíveis "Bearer <jwt>" e cadeias tipo JWT.
    return value
      .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer ***")
      .replace(/\b[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g, "***");
  }

  if (Array.isArray(value)) {
    return value.map((item) => redact(item, depth + 1));
  }

  if (typeof value === "object") {
    const safe = {};
    for (const [key, val] of Object.entries(value)) {
      safe[key] = SENSITIVE_KEY.test(key) ? "***" : redact(val, depth + 1);
    }
    return safe;
  }

  return value;
}

/**
 * Extrai uma mensagem segura de um erro (sem headers/config/token).
 */
export function safeErrorInfo(error) {
  if (!error) return "Erro desconhecido";

  // Erro do axios: usa apenas status + mensagem genérica, nunca o config.
  const status = error?.response?.status;
  if (status) {
    return `Falha na requisição (HTTP ${status})`;
  }

  if (error?.message) {
    return redact(String(error.message));
  }

  return "Erro inesperado";
}

export function logError(context, error) {
  if (!IS_DEV) return; // silencioso em produção
  console.error(`[${context}]`, safeErrorInfo(error));
}

export function logWarn(context, message) {
  if (!IS_DEV) return;
  console.warn(`[${context}]`, redact(message));
}

export default { logError, logWarn, safeErrorInfo };
