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
