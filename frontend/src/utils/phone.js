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
 * Validação leve de telefone brasileiro (espelha o que a lib phonenumbers
 * aceita no backend): celular com 11 dígitos (DDD + 9 + 8, 3º dígito = 9) ou
 * fixo com 10 dígitos (DDD + 8). O backend faz a validação definitiva.
 */
export function isValidBrazilianPhone(value) {
  const digits = getBrazilianPhoneDigits(value);
  if (digits.length === 11) return digits[2] === "9";
  return digits.length === 10;
}
