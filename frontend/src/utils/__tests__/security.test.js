import { describe, it, expect } from "vitest";

import { safeErrorInfo } from "../logger";
import { safeExternalUrl, safeInternalPath } from "../url";
import { validateImageFile, validateDocumentFile } from "../upload";
import { isJwtExpired } from "../auth";

// Helper: cria um File falso com tamanho controlado.
function makeFile(name, { type = "", size = 1024 } = {}) {
  const blob = new Blob(["x"], { type });
  const file = new File([blob], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

// Helper: monta um JWT (apenas estrutura, sem assinatura real) com exp dado.
function makeJwt(expSeconds) {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = btoa(JSON.stringify({ exp: expSeconds }));
  return `${header}.${payload}.assinatura`;
}

describe("logger.safeErrorInfo", () => {
  it("não vaza o header Authorization de um erro do axios", () => {
    const axiosError = {
      message: "Request failed",
      response: { status: 401 },
      config: { headers: { Authorization: "Bearer super.secret.jwt" } },
    };
    const info = safeErrorInfo(axiosError);
    expect(info).not.toContain("super.secret.jwt");
    expect(info).not.toContain("Bearer");
    expect(info).toContain("401");
  });

  it("redige cadeias semelhantes a JWT em mensagens", () => {
    const err = { message: "token=aaaaaaaaaaaaaaaaaaaa.bbbbbbbbbbbb.cccccccccccc" };
    expect(safeErrorInfo(err)).not.toContain("aaaaaaaaaaaaaaaaaaaa.bbbbbbbbbbbb.cccccccccccc");
  });
});

describe("url.safeExternalUrl", () => {
  it("bloqueia javascript:", () => {
    expect(safeExternalUrl("javascript:alert(1)")).toBeNull();
  });

  it("bloqueia data:", () => {
    expect(safeExternalUrl("data:text/html,<script>alert(1)</script>")).toBeNull();
  });

  it("permite https e http", () => {
    expect(safeExternalUrl("https://instagram.com/acapra")).toBe("https://instagram.com/acapra");
    expect(safeExternalUrl("http://exemplo.com/")).toBe("http://exemplo.com/");
  });

  it("permite mailto e tel", () => {
    expect(safeExternalUrl("mailto:a@b.com")).toBe("mailto:a@b.com");
    expect(safeExternalUrl("tel:+5549999999999")).toBe("tel:+5549999999999");
  });

  it("retorna null para entradas inválidas", () => {
    expect(safeExternalUrl("")).toBeNull();
    expect(safeExternalUrl(null)).toBeNull();
    expect(safeExternalUrl("   ")).toBeNull();
  });
});

describe("url.safeInternalPath (anti open-redirect)", () => {
  it("aceita caminhos internos", () => {
    expect(safeInternalPath("/dashboard")).toBe("/dashboard");
  });

  it("bloqueia URLs externas protocol-relative", () => {
    expect(safeInternalPath("//evil.com")).toBe("/");
  });

  it("bloqueia URLs absolutas externas", () => {
    expect(safeInternalPath("https://evil.com")).toBe("/");
  });

  it("usa o fallback fornecido", () => {
    expect(safeInternalPath("javascript:alert(1)", "/login")).toBe("/login");
  });
});

describe("upload.validateImageFile", () => {
  it("rejeita extensão executável (.php) mesmo com MIME de imagem", () => {
    const file = makeFile("shell.php", { type: "image/png" });
    expect(validateImageFile(file)).toBeTruthy();
  });

  it("rejeita arquivo acima do limite de 5MB", () => {
    const file = makeFile("foto.png", { type: "image/png", size: 6 * 1024 * 1024 });
    expect(validateImageFile(file)).toBeTruthy();
  });

  it("rejeita MIME incompatível", () => {
    const file = makeFile("foto.png", { type: "application/x-msdownload" });
    expect(validateImageFile(file)).toBeTruthy();
  });

  it("aceita PNG válido dentro do limite", () => {
    const file = makeFile("foto.png", { type: "image/png", size: 1024 });
    expect(validateImageFile(file)).toBeNull();
  });
});

describe("upload.validateDocumentFile", () => {
  it("aceita PDF", () => {
    const file = makeFile("relatorio.pdf", { type: "application/pdf", size: 1024 });
    expect(validateDocumentFile(file)).toBeNull();
  });

  it("rejeita .docx (não permitido pelo backend)", () => {
    const file = makeFile("doc.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    expect(validateDocumentFile(file)).toBeTruthy();
  });
});

describe("auth.isJwtExpired", () => {
  it("considera token expirado", () => {
    const expired = makeJwt(Math.floor(Date.now() / 1000) - 60);
    expect(isJwtExpired(expired)).toBe(true);
  });

  it("considera token válido", () => {
    const valid = makeJwt(Math.floor(Date.now() / 1000) + 3600);
    expect(isJwtExpired(valid)).toBe(false);
  });

  it("trata token malformado como expirado", () => {
    expect(isJwtExpired("nao-e-um-jwt")).toBe(true);
    expect(isJwtExpired(null)).toBe(true);
  });
});
