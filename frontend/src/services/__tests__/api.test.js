import { describe, expect, it } from "vitest";
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
