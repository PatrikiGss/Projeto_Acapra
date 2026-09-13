const BR_COUNTRY_CODE = "55";

export function getBrazilianPhoneDigits(value) {
  const digits = value.replace(/\D/g, "");

  if (digits.startsWith(BR_COUNTRY_CODE) && digits.length > 11) {
    return digits.slice(2, 13);
  }

  return digits.slice(0, 11);
}

export function formatBrazilianPhone(value) {
  const digits = getBrazilianPhoneDigits(value);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }

  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function toBrazilianPhoneE164(value) {
  const digits = getBrazilianPhoneDigits(value);
  return digits ? `+${BR_COUNTRY_CODE}${digits}` : "";
}

/**
 * Link `wa.me` que abre a conversa direto no WhatsApp. Aceita o número em
 * qualquer formato (E.164 vindo da API, com máscara ou só dígitos) e garante
 * o DDI 55. Retorna null quando não há número.
 */
export function toWhatsAppHref(value) {
  const digits = getBrazilianPhoneDigits(String(value ?? ""));
  return digits ? `https://wa.me/${BR_COUNTRY_CODE}${digits}` : null;
}

/**
 * Validação leve de telefone brasileiro (espelha o que a lib phonenumbers
 * aceita no backend): celular com 11 dígitos (DDD + 9 + 8, 3º dígito = 9) ou
 * fixo com 10 dígitos (DDD + 8). O backend faz a validação definitiva.
 */
export function isValidBrazilianPhone(value) {
  const digits = getBrazilianPhoneDigits(value);
  if (digits.length === 11) return digits[2] === "9";
  return digits.length === 10;
}
