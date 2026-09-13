import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

// A lista de pedidos só aparece para administradores do módulo.
vi.mock("../../../hooks/useAdminAccess", () => ({
  useAdminAccess: () => ({ podeEditar: true }),
}));

vi.mock("../../../services/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import api from "../../../services/api";
import Castracao from "../Castracao";

const STATUS_DISPLAY = { pendente: "Pendente", agendada: "Agendada", realizada: "Realizada" };

let proximoId = 1;

function pedido(nome, status = "pendente", telefone = "+5549999990001") {
  const id = proximoId++;
  return {
    id,
    nome,
    telefone,
    email: null,
    tipo_animal: "cachorro",
    tipo_animal_display: "Cachorro",
    sexo: "femea",
    sexo_display: "Fêmea",
    observacoes: "",
    status,
    status_display: STATUS_DISPLAY[status],
    created_at: "2026-09-01T10:00:00Z",
  };
}

async function renderizar(pedidos) {
  api.get.mockResolvedValue({ data: pedidos });
  render(<Castracao />);
  await screen.findAllByRole("article");
}

function nomesDosCards() {
  return screen
    .getAllByRole("article")
    .map((card) => within(card).getByRole("heading", { level: 3 }).textContent);
}

describe("Castração — lista administrativa", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // A paginação rola a página para o topo; o jsdom não implementa scrollTo.
    window.scrollTo = vi.fn();
  });

  it("mostra os pendentes no topo e agendados/realizados embaixo", async () => {
    await renderizar([
      pedido("Ana", "realizada"),
      pedido("Bruno"),
      pedido("Carla", "agendada"),
      pedido("Davi"),
    ]);

    expect(nomesDosCards()).toEqual(["Bruno", "Davi", "Carla", "Ana"]);
  });

  it("o telefone abre a conversa direto no WhatsApp", async () => {
    await renderizar([pedido("Ana", "pendente", "+5549988887777")]);

    const link = screen.getByRole("link", { name: "(49) 98888-7777" });
    expect(link).toHaveAttribute("href", "https://wa.me/5549988887777");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
  });

  it("filtra por andamento e mostra o total em cada botão", async () => {
    await renderizar([
      pedido("Ana", "realizada"),
      pedido("Bruno"),
      pedido("Carla", "agendada"),
      pedido("Davi"),
    ]);

    expect(screen.getByRole("button", { name: "Todos (4)" })).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: "Pendentes (2)" }));
    expect(nomesDosCards()).toEqual(["Bruno", "Davi"]);
    expect(screen.getByRole("button", { name: "Pendentes (2)" })).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: "Agendados (1)" }));
    expect(nomesDosCards()).toEqual(["Carla"]);

    fireEvent.click(screen.getByRole("button", { name: "Realizados (1)" }));
    expect(nomesDosCards()).toEqual(["Ana"]);
  });

  it("pagina a lista em 12 pedidos por tela", async () => {
    await renderizar(Array.from({ length: 15 }, (_, i) => pedido(`Pessoa ${i + 1}`)));

    expect(screen.getAllByRole("article")).toHaveLength(12);

    fireEvent.click(screen.getByRole("button", { name: "2" }));
    expect(screen.getAllByRole("article")).toHaveLength(3);
    expect(nomesDosCards()).toEqual(["Pessoa 13", "Pessoa 14", "Pessoa 15"]);
  });

  it("trocar o filtro volta para a 1ª página", async () => {
    await renderizar([
      ...Array.from({ length: 13 }, (_, i) => pedido(`Pendente ${i + 1}`)),
      pedido("Zé", "agendada"),
    ]);

    fireEvent.click(screen.getByRole("button", { name: "2" }));
    expect(screen.getByRole("button", { name: "2" })).toHaveAttribute("aria-current", "page");

    fireEvent.click(screen.getByRole("button", { name: "Pendentes (13)" }));
    expect(screen.getByRole("button", { name: "1" })).toHaveAttribute("aria-current", "page");
  });

  it("mudar o andamento mantém o admin na página em que estava", async () => {
    const pedidos = Array.from({ length: 14 }, (_, i) => pedido(`Pessoa ${i + 1}`));
    await renderizar(pedidos);

    fireEvent.click(screen.getByRole("button", { name: "2" }));
    expect(nomesDosCards()).toEqual(["Pessoa 13", "Pessoa 14"]);

    api.patch.mockResolvedValue({ data: {} });
    api.get.mockResolvedValue({
      data: pedidos.map((p) => (
        p.nome === "Pessoa 13" ? { ...p, status: "agendada", status_display: "Agendada" } : p
      )),
    });

    fireEvent.change(screen.getByLabelText("Andamento do pedido de Pessoa 13"), {
      target: { value: "agendada" },
    });

    await screen.findByRole("button", { name: "Agendados (1)" });
    expect(api.patch).toHaveBeenCalledWith(`/api/castracao/castracoes/${pedidos[12].id}/`, {
      status: "agendada",
    });
    // Continua na página 2, agora com o pendente restante antes do agendado.
    expect(screen.getByRole("button", { name: "2" })).toHaveAttribute("aria-current", "page");
    await waitFor(() => expect(nomesDosCards()).toEqual(["Pessoa 14", "Pessoa 13"]));
  });
});
