/// <reference types="vite/client" />

/* Tipos das variáveis de ambiente do painel.
   Declaradas aqui para o TypeScript conferir os nomes: um erro de
   digitação em VITE_SUPABASE_URL passa a ser erro de compilação,
   não um undefined silencioso em produção. */
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
