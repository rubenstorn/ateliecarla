#!/usr/bin/env node
/* =========================================================
   Regrava dados/catalogo.json a partir do Supabase

     node ferramentas/exportar-catalogo.mjs

   O site lê dados/catalogo.json direto (fetch estático, sem
   depender do Supabase estar no ar). O painel edita as tabelas
   catalogo_config / catalogo_categorias / catalogo_itens — este
   script é o elo entre as duas coisas. Rode depois de editar no
   painel e antes de "node ferramentas/montar-deploy.mjs".

   Sem dependências: usa fetch nativo do Node contra a API REST
   do PostgREST, com a mesma chave anon do painel (painel/.env).
   ========================================================= */

import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')
const ARQUIVO_JSON = join(RAIZ, 'dados', 'catalogo.json')
const ARQUIVO_ENV = join(RAIZ, 'painel', '.env')

async function lerEnv() {
  let texto
  try {
    texto = await readFile(ARQUIVO_ENV, 'utf8')
  } catch {
    throw new Error(`Não achei ${ARQUIVO_ENV}. Copie painel/.env.example para painel/.env e preencha as chaves do Supabase.`)
  }

  const vars = {}
  for (const linha of texto.split('\n')) {
    const m = linha.match(/^\s*([A-Z_]+)\s*=\s*(.+?)\s*$/)
    if (m) vars[m[1]] = m[2]
  }

  const url = vars.VITE_SUPABASE_URL
  const chave = vars.VITE_SUPABASE_ANON_KEY

  if (!url || url.includes('SEU-PROJETO') || !chave || chave.includes('COLE_AQUI')) {
    throw new Error('painel/.env existe mas as chaves do Supabase não estão preenchidas.')
  }

  return { url, chave }
}

async function buscar(url, chave, caminho) {
  const resp = await fetch(`${url}/rest/v1/${caminho}`, {
    headers: { apikey: chave, Authorization: `Bearer ${chave}` },
  })
  if (!resp.ok) {
    throw new Error(`Falha ao buscar ${caminho}: HTTP ${resp.status} ${await resp.text()}`)
  }
  return resp.json()
}

async function principal() {
  console.log('\nExportando o catálogo do Supabase para dados/catalogo.json\n' + '='.repeat(38))

  const { url, chave } = await lerEnv()

  const [config, categorias, itens] = await Promise.all([
    buscar(url, chave, 'catalogo_config?id=eq.1&select=*'),
    buscar(url, chave, 'catalogo_categorias?select=*&order=ordem.asc,titulo.asc'),
    buscar(url, chave, 'catalogo_itens?select=*&order=ordem.asc,nome.asc'),
  ])

  if (!categorias.length) {
    console.warn('\n⚠ Nenhuma categoria no banco. Cadastre em Painel › Catálogo antes de exportar.\n')
  }

  /* preserva _leiaMe e midia (vídeo do Repigment) do arquivo atual —
     esses dois campos ainda não migraram para o banco */
  let atual = { _leiaMe: '', midia: {} }
  try {
    atual = JSON.parse(await readFile(ARQUIVO_JSON, 'utf8'))
  } catch {
    // primeiro export, sem arquivo anterior — segue com os padrões acima
  }

  const saida = {
    _leiaMe: atual._leiaMe || 'Fonte única do catálogo. Gerado por ferramentas/exportar-catalogo.mjs a partir do Supabase — não edite este arquivo à mão, edite no painel.',
    vigencia: config[0]?.vigencia ?? '',
    agendamento: config[0]?.agendamento ?? '',
    midia: atual.midia || {},
    categorias: categorias.map((c) => ({
      id: c.id,
      titulo: c.titulo,
      tom: c.tom,
      precoPartir: c.preco_partir,
      tempo: c.tempo,
      foto: c.foto_url || null,
      etiqueta: c.etiqueta,
      itens: itens
        .filter((i) => i.categoria_id === c.id)
        .map((i) => ({
          nome: i.nome,
          preco: i.preco,
          duracao: i.duracao,
          foto: i.foto_url || null,
          etiqueta: i.etiqueta,
        })),
    })),
  }

  await writeFile(ARQUIVO_JSON, JSON.stringify(saida, null, 2) + '\n', 'utf8')

  console.log(`\n✓ dados/catalogo.json regravado: ${saida.categorias.length} categorias, ${itens.length} procedimentos.\n`)
}

principal().catch((erro) => {
  console.error('\n✗ ' + erro.message + '\n')
  process.exit(1)
})
