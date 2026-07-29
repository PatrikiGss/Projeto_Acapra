import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Configuração dedicada de testes (não carrega o servidor/proxy do app).
// O plugin do React é necessário para transformar o JSX dos testes de componente.
export default defineConfig({
  plugins: [react()],
  // JSX automático: os componentes do projeto não importam React explicitamente.
  esbuild: { jsx: "automatic" },
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.{test,spec}.{js,jsx}"],
  },
});
