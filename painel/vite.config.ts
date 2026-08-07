import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      /* o "@/" que o shadcn usa em todos os imports */
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  server: {
    port: 4322,
    /* a landing page roda em 4321; o painel fica ao lado, sem conflito */
  },

  build: {
    /* sai em painel/dist — publique como subpasta /admin do site */
    outDir: 'dist',
    sourcemap: false,
  },
})
