/* =========================================================
   Ateliê Carla — configuração do Supabase

   ⚠️ PREENCHA OS DOIS VALORES ABAIXO antes de usar.
   Onde achar: painel do Supabase › Project Settings › API

   -----------------------------------------------------------
   SOBRE A CHAVE ANON SER PÚBLICA

   A chave anon fica visível para qualquer visitante — isso é
   normal e esperado, é assim que o Supabase foi desenhado. O que
   protege o banco NÃO é o segredo da chave, são as políticas de
   Row Level Security do schema.sql.

   Com as políticas em vigor, quem tem a chave anon consegue:
   · ler hero, seo, e vídeos/mídias publicados
   · inserir um lead
   E nada mais. Não consegue ler a lista de leads, não consegue
   editar conteúdo, não consegue apagar nada.

   ⛔ NUNCA coloque aqui a chave `service_role`. Ela ignora toda
   a RLS. Ela só é usada em servidor, nunca no navegador.
   ========================================================= */

export const SUPABASE_URL = 'https://bnnhwefceiegsaklvtec.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_FEnyiE6NCo0dR9ELbBrmBA_bhId0NCo';

/* versão do supabase-js, via CDN — sem npm, sem build */
export const SUPABASE_JS = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';

/* nome do bucket de imagens criado pelo schema.sql */
export const BUCKET = 'midias';

/* -----------------------------------------------------------
   Guarda contra "esqueci de configurar"

   Sem isto, um config em branco produz erro de rede confuso.
   Assim o console diz exatamente o que falta fazer.
   ----------------------------------------------------------- */

export function configurado() {
  return !SUPABASE_URL.includes('SEU-PROJETO')
      && !SUPABASE_ANON_KEY.includes('COLE_AQUI');
}

export function avisarSeNaoConfigurado() {
  if (configurado()) return false;

  console.warn(
    '[Ateliê Carla] Supabase ainda não configurado.\n' +
    'Preencha SUPABASE_URL e SUPABASE_ANON_KEY em api/config.js.\n' +
    'Painel do Supabase › Project Settings › API.\n' +
    'Enquanto isso, o site funciona com o conteúdo estático.'
  );

  return true;
}
