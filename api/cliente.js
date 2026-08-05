/* =========================================================
   Ateliê Carla — cliente Supabase compartilhado

   Um único ponto de criação do cliente, usado tanto pela
   landing page (leitura pública + gravação de lead) quanto pelo
   painel (autenticado). Evita duas instâncias disputando a
   mesma sessão no localStorage.
   ========================================================= */

import {
  SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_JS, BUCKET,
  configurado, avisarSeNaoConfigurado
} from './config.js';

let instancia = null;

/**
 * Devolve o cliente Supabase, ou null se a configuração não foi
 * preenchida. Quem chama SEMPRE precisa tratar o null — é isso
 * que mantém o site funcionando sem backend configurado.
 *
 * @param {object} opcoes
 * @param {boolean} opcoes.persistirSessao  true no painel (mantém login),
 *                                          false na landing (não precisa)
 */
export async function obterCliente(opcoes = {}) {
  if (avisarSeNaoConfigurado()) return null;
  if (instancia) return instancia;

  try {
    const { createClient } = await import(SUPABASE_JS);

    instancia = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: opcoes.persistirSessao !== false,
        autoRefreshToken: opcoes.persistirSessao !== false,
        detectSessionInUrl: false
      }
    });

    return instancia;
  } catch (erro) {
    console.error('[Ateliê Carla] falha ao carregar supabase-js:', erro.message);
    return null;
  }
}

/**
 * URL pública de um arquivo do bucket de mídias.
 * @param {string} caminho  ex: 'galeria/nanoblading-01.webp'
 */
export function urlPublica(caminho) {
  if (!configurado() || !caminho) return null;
  if (/^https?:\/\//.test(caminho)) return caminho;   // já é URL completa

  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${caminho}`;
}

export { BUCKET, configurado };
