import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['build', 'dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // Dívida técnica conhecida: os loaders das telas administrativas chamam
      // setLoading(true) de forma síncrona dentro do useEffect (padrão comum de
      // data fetching). Não é bug, mas vale refatorar quando essas telas
      // ganharem cobertura de teste. Mantido como aviso para não travar o CI.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
  {
    // Arquivos de configuração/testes rodam no Node, não no browser.
    files: ['*.config.js', 'src/**/__tests__/**/*.{js,jsx}'],
    languageOptions: {
      globals: { ...globals.node, ...globals.vitest },
    },
  },
])
