import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

vi.mock("../../../services/api", () => ({
  default: { get: vi.fn() },
  getMediaURL: vi.fn((path) => `https://acapra.org.br/api${path}`),
}));

import api from "../../../services/api";
import AnimalDetail from "../AnimalDetail";

function criarAnimal(extra = {}) {
  return {
    id: 7,
    nome_animal: "Thor",
    nome_doador: "Maria",
    telefone: "+5549999990001",
    especie: "cachorro",
    sexo: "macho",
    foto: "/media/fotos/thor.webp",
    fotos: [],
    descricao: "Muito dócil.",
    created_at: "2026-09-01T10:00:00Z",
    ...extra,
  };
}

async function renderizar(animal) {
  api.get.mockResolvedValue({ data: animal });
  render(
    <MemoryRouter initialEntries={["/adocao/7"]}>
      <Routes>
        <Route path="/adocao/:id" element={<AnimalDetail />} />
      </Routes>
    </MemoryRouter>,
  );
  await screen.findByRole("heading", { level: 1, name: animal.nome_animal });
}

describe("AnimalDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mostra o dono quando ele foi informado", async () => {
    await renderizar(criarAnimal());

    expect(api.get).toHaveBeenCalledWith("/api/adocao/animais/7/");
    expect(screen.getByText("Dono")).toBeInTheDocument();
    expect(screen.getByText("Maria")).toBeInTheDocument();
  });

  it("esconde o campo Dono quando não há nome", async () => {
    await renderizar(criarAnimal({ nome_doador: "" }));

    expect(screen.queryByText("Dono")).not.toBeInTheDocument();
    expect(screen.queryByText(/doador/i)).not.toBeInTheDocument();
  });

  it("carrega a foto pela URL pública de mídia", async () => {
    await renderizar(criarAnimal());

    expect(screen.getByAltText("Thor")).toHaveAttribute(
      "src",
      "https://acapra.org.br/api/media/fotos/thor.webp",
    );
  });
});
