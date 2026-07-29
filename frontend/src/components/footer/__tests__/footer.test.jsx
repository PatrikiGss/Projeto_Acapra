import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// O footer busca os dados de contato ao montar; a API é mockada para o teste
// não depender de rede.
vi.mock("../../../services/api", () => ({
  default: { get: vi.fn(() => Promise.resolve({ data: {} })) },
}));

import Footer from "../footer";

function renderFooter() {
  return render(
    <MemoryRouter>
      <Footer />
    </MemoryRouter>,
  );
}

describe("Footer — créditos de desenvolvimento", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mostra apenas Kaue, Patriki e Iago", () => {
    renderFooter();

    expect(screen.getByText("kauekluska@gmail.com")).toBeInTheDocument();
    expect(screen.getByText("patrikigss321@gmail.com")).toBeInTheDocument();
    expect(screen.getByText("iagoamaral607@gmail.com")).toBeInTheDocument();
  });

  it("não mostra os desenvolvedores removidos", () => {
    renderFooter();

    const removidos = [
      "mateuscorreiacoelho706@gmail.com",
      "anderson.bolduan@gmail.com",
      "vanderlei.junior1993@gmail.com",
      "tonetto.irai@gmail.com",
    ];

    removidos.forEach((email) => {
      expect(screen.queryByText(email)).not.toBeInTheDocument();
    });
  });

  it("lista exatamente 3 créditos", () => {
    const { container } = renderFooter();
    const itens = container.querySelectorAll(".footer-credits-list li");
    expect(itens).toHaveLength(3);
  });
});
