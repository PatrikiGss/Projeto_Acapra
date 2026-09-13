import { afterEach, describe, expect, it, vi } from "vitest";
import { getMediaURL } from "../api";

describe("getMediaURL", () => {
  it("mantém caminhos /media/... sem duplicar o prefixo", () => {
    const url = getMediaURL("/media/noticias/2026/06/27/a.webp");
    expect(url).not.toContain("/media/media");
    expect(url).not.toContain("/api/media/media");
    expect(url.endsWith("/media/noticias/2026/06/27/a.webp")).toBe(true);
  });

  it("prefixa caminhos crus com /media/", () => {
    const url = getMediaURL("noticias/a.webp");
    expect(url.endsWith("/media/noticias/a.webp")).toBe(true);
    expect(url).not.toContain("/media/media");
  });

  it("preserva caminhos /api/media/... legados sem duplicar", () => {
    const url = getMediaURL("/api/media/noticias/a.webp");
    expect(url).not.toContain("/api/media/media");
    expect(url.endsWith("/api/media/noticias/a.webp")).toBe(true);
  });

  it("usa imagem placeholder quando o caminho é vazio", () => {
    expect(getMediaURL("")).toBe("/adocao-cachorro.webp");
    expect(getMediaURL(null)).toBe("/adocao-cachorro.webp");
  });

  it("reescreve o caminho de URLs absolutas do backend local", () => {
    const url = getMediaURL("http://127.0.0.1:8000/media/noticias/a.webp");
    expect(url).not.toContain("/media/media");
    expect(url.endsWith("/media/noticias/a.webp")).toBe(true);
  });
});

// Em produção o build usa VITE_MEDIA_BASE_URL=https://acapra.org.br/api. A base
// é lida quando o módulo carrega, então cada teste reimporta o api.js.
describe("getMediaURL com a base de produção", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  async function carregarComBase(base) {
    vi.stubEnv("VITE_MEDIA_BASE_URL", base);
    vi.resetModules();
    return (await import("../api")).getMediaURL;
  }

  it("monta a URL pública em /api/media/", async () => {
    const getMediaURLProd = await carregarComBase("https://acapra.org.br/api");

    expect(getMediaURLProd("/media/fotos/a.webp")).toBe("https://acapra.org.br/api/media/fotos/a.webp");
    expect(getMediaURLProd("fotos/a.webp")).toBe("https://acapra.org.br/api/media/fotos/a.webp");
  });

  it("não duplica o /api de caminhos legados /api/media/", async () => {
    const getMediaURLProd = await carregarComBase("https://acapra.org.br/api");

    expect(getMediaURLProd("/api/media/fotos/a.webp")).toBe("https://acapra.org.br/api/media/fotos/a.webp");
  });

  it("ignora barra final na base e não altera URLs externas", async () => {
    const getMediaURLProd = await carregarComBase("https://acapra.org.br/api/");

    expect(getMediaURLProd("/media/fotos/a.webp")).toBe("https://acapra.org.br/api/media/fotos/a.webp");
    expect(getMediaURLProd("https://cdn.exemplo.com/a.webp")).toBe("https://cdn.exemplo.com/a.webp");
  });
});
