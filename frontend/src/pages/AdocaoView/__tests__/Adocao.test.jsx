import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Visão do público (sem permissão de edição).
vi.mock("../../../hooks/useAdminAccess", () => ({
  useAdminAccess: () => ({ podeEditar: false }),
}));

vi.mock("../../../services/api", () => ({
  default: { get: vi.fn() },
  getMediaURL: vi.fn((path) => `https://acapra.org.br/api${path}`),
}));

import api from "../../../services/api";
import Adocao from "../Adocao";

const ANIMAIS = [
  {
    id: 1,
    nome_animal: "Thor",
    nome_doador: "Maria",
    especie: "cachorro",
    sexo: "macho",
    foto: "/media/fotos/thor.webp",
    fotos: [],
    disponivel: true,
  },
  {
    id: 2,
    nome_animal: "Luna",
    nome_doador: "",
    especie: "gato",
    sexo: "femea",
    foto: null,
    fotos: [],
    disponivel: true,
  },
];

async function renderizar() {
  render(
    <MemoryRouter>
      <Adocao />
    </MemoryRouter>,
  );
  await screen.findByRole("heading", { name: "Thor" });
}

describe("Adoção — cards públicos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue({ data: ANIMAIS });
  });

  it("mostra o dono só nos animais que têm um informado", async () => {
    await renderizar();

    expect(screen.getByText("Dono: Maria")).toBeInTheDocument();
    expect(screen.getAllByText(/^Dono:/)).toHaveLength(1);
    expect(screen.queryByText(/Doador:/)).not.toBeInTheDocument();
  });

  it("usa a URL pública de mídia na foto do card", async () => {
    await renderizar();

    expect(screen.getByAltText("Thor")).toHaveAttribute(
      "src",
      "https://acapra.org.br/api/media/fotos/thor.webp",
    );
  });
});
