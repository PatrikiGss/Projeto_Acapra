import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  server: {
<<<<<<< HEAD
    port: 3000
=======
    port: 5173,
    strictPort: true,
>>>>>>> 0140d65813e373354c943297caa6aa3eb01b5ebf
  }
})

