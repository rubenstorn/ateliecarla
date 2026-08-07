/* =========================================================
   Endereço da landing page

   Em desenvolvimento são dois servidores diferentes:
     4321 → landing page (npx serve na raiz do projeto)
     4322 → este painel (vite)

   Publicado, os dois viram o mesmo domínio:
     /        → landing page
     /admin/  → este painel

   Sem esta distinção, um href="/" dentro do painel aponta para o
   próprio painel em desenvolvimento — foi exatamente o que
   acontecia com o botão "Ver o site".
   ========================================================= */

export const URL_SITE = import.meta.env.DEV ? 'http://localhost:4321/' : '/'
