import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ command }) => ({
  /* Publicado, o painel mora em carladenisebeauty.com.br/admin/ —
     sem este "base" o HTML gerado pediria /assets/index-xxx.js na
     raiz do domínio e daria 404 em tudo.

     Em desenvolvimento fica "/" para o servidor continuar
     respondendo em localhost:4322 direto, sem /admin no caminho. */
  base: command === 'build' ? '/admin/' : '/',

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
}))
