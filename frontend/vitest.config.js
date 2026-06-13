import { defineConfig } from "vitest/config";

// Configuração dedicada de testes (não carrega o servidor/proxy do app).
export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.{test,spec}.{js,jsx}"],
  },
});
