import { describe, expect, it } from "vitest";
import {
  formatBrazilianPhone,
  toBrazilianPhoneE164,
  isValidBrazilianPhone,
} from "../phone";

describe("phone utils", () => {
  it("formata número de celular com máscara", () => {
    expect(formatBrazilianPhone("49999990000")).toBe("(49) 99999-0000");
  });

  it("converte para E.164 brasileiro", () => {
    expect(toBrazilianPhoneE164("(49) 99999-0000")).toBe("+5549999990000");
    expect(toBrazilianPhoneE164("")).toBe("");
  });

  it("aceita celular (11 dígitos, 3º = 9) e fixo (10 dígitos)", () => {
    expect(isValidBrazilianPhone("(49) 99999-0000")).toBe(true);
    expect(isValidBrazilianPhone("(49) 3333-0000")).toBe(true);
  });

  it("recusa telefone incompleto ou inválido", () => {
    expect(isValidBrazilianPhone("")).toBe(false);
    expect(isValidBrazilianPhone("4999")).toBe(false);
    expect(isValidBrazilianPhone("abc")).toBe(false);
    // 11 dígitos mas 3º não é 9 (celular inválido)
    expect(isValidBrazilianPhone("(49) 88888-0000")).toBe(false);
  });
});
