#!/usr/bin/env node
/* =========================================================
   Importa dados/catalogo.json para o Supabase (uso único)

     SUPABASE_SERVICE_ROLE_KEY=xxxxx node ferramentas/importar-catalogo.mjs

   Roda uma vez, depois de aplicar backend/schema.sql no SQL Editor
   do Supabase, para popular catalogo_config / catalogo_categorias /
   catalogo_itens com o que já existe em dados/catalogo.json. Depois
   disso a edição é pelo painel (aba Catálogo) — este script não
   precisa rodar de novo, a menos que você queira repopular do zero
   (ele apaga categorias/itens existentes antes de inserir).

   Por que pede a chave service_role por variável de ambiente, e não
   lê de painel/.env como o exportar-catalogo.mjs: as tabelas exigem
   sessão autenticada para escrever (política de RLS), e este script
   roda fora do navegador, sem login. A service_role ignora RLS — por
   isso NUNCA deve morar num arquivo (painel/.env vai para o pacote
   do navegador em outras variáveis, e mesmo fora dele um arquivo em
   disco é fácil de vazar por engano). Pega no Supabase em Project
   Settings › API › service_role, cola só no comando, uma vez.
   ========================================================= */

import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')
const ARQUIVO_JSON = join(RAIZ, 'dados', 'catalogo.json')
const ARQUIVO_ENV = join(RAIZ, 'painel', '.env')

/* o schema só aceita estes 5 tons; o catalogo.json tem "pink" e
   "ambar" de uma nomenclatura antiga — mapeia para os mais próximos */
const MAPA_TOM = {
  rosa: 'rosa',
  lilas: 'lilas',
  azul: 'azul',
  pink: 'verde',
  ambar: 'dourado',
  verde: 'verde',
  dourado: 'dourado',
}

async function lerUrl() {
  let texto
  try {
    texto = await readFile(ARQUIVO_ENV, 'utf8')
  } catch {
    throw new Error(`Não achei ${ARQUIVO_ENV}. Copie painel/.env.example para painel/.env e preencha VITE_SUPABASE_URL.`)
  }

  const m = texto.match(/^\s*VITE_SUPABASE_URL\s*=\s*(.+?)\s*$/m)
  const url = m?.[1]

  if (!url || url.includes('SEU-PROJETO')) {
    throw new Error('painel/.env existe mas VITE_SUPABASE_URL não está preenchida.')
  }

  return url
}

async function chamar(url, chave, caminho, opcoes = {}) {
  const resp = await fetch(`${url}/rest/v1/${caminho}`, {
    ...opcoes,
    headers: {
      apikey: chave,
      Authorization: `Bearer ${chave}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...opcoes.headers,
    },
  })
  if (!resp.ok) {
    throw new Error(`Falha em ${caminho}: HTTP ${resp.status} ${await resp.text()}`)
  }
  const texto = await resp.text()
  return texto ? JSON.parse(texto) : null
}

async function principal() {
  console.log('\nImportando dados/catalogo.json para o Supabase\n' + '='.repeat(38))

  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!chave) {
    console.error('\n✗ Faltou a variável SUPABASE_SERVICE_ROLE_KEY.')
    console.error('  Pegue em Supabase › Project Settings › API › service_role e rode:')
    console.error('    SUPABASE_SERVICE_ROLE_KEY=xxxxx node ferramentas/importar-catalogo.mjs\n')
    process.exit(1)
  }

  const url = await lerUrl()
  const catalogo = JSON.parse(await readFile(ARQUIVO_JSON, 'utf8'))

  console.log('\n[1] Gravando vigência e link de agendamento…')
  await chamar(url, chave, 'catalogo_config?id=eq.1', {
    method: 'PATCH',
    body: JSON.stringify({
      vigencia: catalogo.vigencia || '',
      agendamento: catalogo.agendamento || '',
    }),
  })

  console.log('[2] Limpando categorias/itens existentes (reimportação do zero)…')
  await chamar(url, chave, 'catalogo_itens?id=not.is.null', { method: 'DELETE' })
  await chamar(url, chave, 'catalogo_categorias?id=not.is.null', { method: 'DELETE' })

  console.log('[3] Inserindo categorias e procedimentos…')
  let totalItens = 0

  for (const [indice, cat] of catalogo.categorias.entries()) {
    const [categoriaInserida] = await chamar(url, chave, 'catalogo_categorias', {
      method: 'POST',
      body: JSON.stringify({
        titulo: cat.titulo,
        tom: MAPA_TOM[cat.tom] || 'rosa',
        preco_partir: cat.precoPartir || '',
        tempo: cat.tempo || '',
        foto_url: cat.foto || null,
        etiqueta: cat.etiqueta || '',
        ordem: indice,
      }),
    })

    const itens = (cat.itens || []).map((item, i) => ({
      categoria_id: categoriaInserida.id,
      nome: item.nome,
      preco: item.preco || '',
      duracao: item.duracao || '',
      foto_url: item.foto || null,
      etiqueta: item.etiqueta || '',
      ordem: i,
    }))

    if (itens.length) {
      await chamar(url, chave, 'catalogo_itens', { method: 'POST', body: JSON.stringify(itens) })
      totalItens += itens.length
    }

    console.log(`    · ${cat.titulo} (${itens.length} procedimentos)`)
  }

  console.log(`\n✓ Importado: ${catalogo.categorias.length} categorias, ${totalItens} procedimentos.`)
  console.log('  Confira em Painel › Catálogo. A partir de agora edite só por lá.\n')
}

principal().catch((erro) => {
  console.error('\n✗ ' + erro.message + '\n')
  process.exit(1)
})
