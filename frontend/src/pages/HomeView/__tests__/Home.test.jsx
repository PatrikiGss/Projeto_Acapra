import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Home from "../Home";

vi.mock("../../../services/api", () => {
  return {
    default: {
      get: vi.fn((url) => {
        if (url.includes("/api/noticias/publicacoes/")) {
          return Promise.resolve({
            data: [
              {
                id: 1,
                categoria: "resgates",
                categoria_display: "Resgate",
                titulo: "Resgate de filhote",
                resumo: "Filhote foi resgatado com sucesso.",
                foto: "/media/noticias/2026/06/27/filhote.webp",
              },
            ],
          });
        }
        return Promise.resolve({ data: [] });
      }),
    },
    getMediaURL: vi.fn((path) => (path ? `https://api.acapra.org.br${path}` : "/adocao-cachorro.webp")),
  };
});

describe("Home — renderização de imagens de notícias", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("chama getMediaURL para publicações vindas da API", async () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Resgate de filhote")).toBeInTheDocument();
    });

    const newsImg = screen.getByAltText("Resgate de filhote");
    expect(newsImg).toBeInTheDocument();
    expect(newsImg.getAttribute("src")).toBe("https://api.acapra.org.br/media/noticias/2026/06/27/filhote.webp");
  });

  it("utiliza a imagem estática de exemplo quando não há publicações", async () => {
    const api = (await import("../../../services/api")).default;
    api.get.mockImplementation(() => Promise.resolve({ data: [] }));

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Campanha de arrecadação ganha novos pontos de coleta")).toBeInTheDocument();
    });

    const newsImg = screen.getByAltText("Campanha de arrecadação ganha novos pontos de coleta");
    expect(newsImg).toBeInTheDocument();
    expect(newsImg.getAttribute("src")).toBe("/carousel-voluntariado.jpg");
  });
});
