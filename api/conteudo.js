/* =========================================================
   Ateliê Carla — leitura pública e gravação de lead

   É a "camada de API" da landing page. Não existe servidor nem
   API route: o Supabase expõe a API REST e a RLS decide o que
   cada chave pode fazer. Este módulo só embala as chamadas.

   Regra de ouro de todas as funções daqui: **falhar em silêncio
   e devolver null/[]**. Se o backend estiver fora, mal
   configurado ou lento, a landing page tem que continuar de pé
   com o conteúdo estático que já está no HTML.
   ========================================================= */

import { obterCliente, urlPublica } from './cliente.js';

/* ---------------------------------------------------------
   Leitura
   --------------------------------------------------------- */

/** @returns {Promise<object|null>} conteúdo do hero, ou null */
export async function lerHero() {
  const sb = await obterCliente({ persistirSessao: false });
  if (!sb) return null;

  const { data, error } = await sb
    .from('hero')
    .select('selo, titulo, titulo_destaque, subtitulo, cta_texto, cta_url')
    .eq('id', 1)
    .maybeSingle();

  if (error) {
    console.warn('[hero]', error.message);
    return null;
  }

  return data;
}

/** @returns {Promise<Array>} vídeos publicados, na ordem definida */
export async function lerVideos() {
  const sb = await obterCliente({ persistirSessao: false });
  if (!sb) return [];

  const { data, error } = await sb
    .from('videos')
    .select('id, titulo, descricao, url, thumbnail_url')
    .eq('publicado', true)
    .order('ordem', { ascending: true })
    .order('criado_em', { ascending: false });

  if (error) {
    console.warn('[videos]', error.message);
    return [];
  }

  return (data || [])
    .filter((v) => v.url)                      /* sem URL não há o que mostrar */
    .map((v) => ({ ...v, thumbnail_url: urlPublica(v.thumbnail_url) }));
}

/**
 * @param {string} grupo  'galeria', 'antes-depois'…
 * @returns {Promise<Array>} imagens publicadas do grupo
 */
export async function lerMidias(grupo = 'galeria') {
  const sb = await obterCliente({ persistirSessao: false });
  if (!sb) return [];

  const { data, error } = await sb
    .from('midias')
    .select('id, titulo, imagem_url, alt, largura, altura')
    .eq('grupo', grupo)
    .eq('publicado', true)
    .order('ordem', { ascending: true })
    .order('criado_em', { ascending: false });

  if (error) {
    console.warn('[midias]', error.message);
    return [];
  }

  return (data || []).map((m) => ({ ...m, imagem_url: urlPublica(m.imagem_url) }));
}

/* ---------------------------------------------------------
   Gravação de lead

   Único ponto onde o público escreve no banco. A RLS aceita
   apenas INSERT com status='novo' e observacoes nula — ver
   a política "leads: público insere" no schema.sql.
   --------------------------------------------------------- */

/**
 * @param {object} lead  { nome, telefone, email?, procedimento?, mensagem?, origem? }
 * @returns {Promise<{ok: boolean, erro?: string}>}
 */
export async function enviarLead(lead) {
  const nome = (lead.nome || '').trim();
  const telefone = (lead.telefone || '').trim();

  /* validação no cliente é conveniência; o CHECK do banco é a
     garantia real. Os dois existem de propósito. */
  if (nome.length < 2) return { ok: false, erro: 'Escreva seu nome completo.' };
  if (telefone.replace(/\D/g, '').length < 10) {
    return { ok: false, erro: 'Informe um telefone com DDD.' };
  }

  const sb = await obterCliente({ persistirSessao: false });
  if (!sb) {
    return { ok: false, erro: 'Cadastro fora do ar. Chame no WhatsApp: (62) 3558-2655.' };
  }

  const { error } = await sb.from('leads').insert({
    nome,
    telefone,
    email: (lead.email || '').trim() || null,
    procedimento: (lead.procedimento || '').trim() || null,
    mensagem: (lead.mensagem || '').trim() || null,
    origem: lead.origem || 'formulario-site'
    /* status e observacoes ficam de fora: a RLS rejeitaria */
  });

  if (error) {
    console.warn('[lead]', error.message);
    return { ok: false, erro: 'Não conseguimos registrar agora. Chame no WhatsApp: (62) 3558-2655.' };
  }

  return { ok: true };
}
