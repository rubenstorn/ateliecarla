#!/usr/bin/env node
/* =========================================================
   Monta a pasta "publicar/" pronta para subir na hospedagem

     node ferramentas/montar-deploy.mjs

   O que ele faz:
     1. constrói o painel (npm --prefix painel run build)
     2. cria publicar/ do zero
     3. copia a landing page para a raiz
     4. copia painel/dist para publicar/admin
     5. grava _redirects e _headers

   Depois é só arrastar a pasta publicar/ para o Netlify ou o
   Cloudflare Pages. Sem dependências: só Node.
   ========================================================= */

import { rm, mkdir, cp, writeFile, readFile, stat } from 'node:fs/promises'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')
const SAIDA = join(RAIZ, 'publicar')

/* o que a landing page precisa em produção.
   Fora daqui: painel/ (vai compilado), backend/ (scripts locais),
   ferramentas/ (uso interno), react/ (sobra antiga), .claude/ */
const DA_LANDING = [
  'index.html',
  'index.css',
  'index.js',
  'assets',
  'dados',
  'api',
  'webgl',
]

/* ---------------------------------------------------------
   Regras da hospedagem

   Netlify e Cloudflare Pages leem os dois arquivos abaixo.
   --------------------------------------------------------- */

const REDIRECTS = `# O painel é uma SPA: qualquer caminho sob /admin deve devolver
# o index.html dele, senão /admin/contatos dá 404 ao recarregar.
/admin/*  /admin/index.html  200
`

const HEADERS = `# Cabeçalhos de segurança para o site inteiro
/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=()

# O painel não deve aparecer em busca nenhuma
/admin/*
  X-Robots-Tag: noindex, nofollow

# Arquivos com hash no nome nunca mudam: cache longo
/admin/assets/*
  Cache-Control: public, max-age=31536000, immutable

# A tabela de preços muda sem trocar de nome: cache curto
/dados/*
  Cache-Control: public, max-age=300, must-revalidate
`

/* ---------------------------------------------------------
   Auxiliares
   --------------------------------------------------------- */

async function existe(caminho) {
  try { await stat(caminho); return true } catch { return false }
}

function passo(n, texto) {
  console.log(`\n[${n}] ${texto}`)
}

/* ---------------------------------------------------------
   Principal
   --------------------------------------------------------- */

async function principal() {
  console.log('\nMontando a pasta de publicação\n' + '='.repeat(38))

  console.log('\n[lembrete] dados/catalogo.json não se atualiza sozinho.')
  console.log('  Se você editou preços/categorias no painel, rode antes:')
  console.log('    node ferramentas/exportar-catalogo.mjs\n')

  /* ---- 1. constrói o painel ---- */

  passo(1, 'Construindo o painel…')

  /* execSync com um comando único, não execFileSync com argumentos.

     Dois motivos. No Windows, desde a correção do CVE-2024-27980, o
     Node recusa executar arquivos .cmd (como o npm.cmd) sem shell.
     E passar argumentos separados COM shell:true dispara aviso de
     depreciação, porque eles não são escapados. Comando único
     resolve os dois — e aqui não há entrada de usuário para
     escapar, o comando é fixo. */
  try {
    execSync('npm --prefix painel run build', {
      cwd: RAIZ,
      stdio: 'inherit',
    })
  } catch (erro) {
    console.error('\n✗ A construção do painel falhou.')
    /* mostra o motivo real: engolir a mensagem aqui já custou
       uma rodada inteira de diagnóstico */
    console.error('  ' + (erro.message || erro))
    console.error('\n  Tente rodar direto para ver o erro completo:')
    console.error('    npm --prefix painel run build\n')
    process.exit(1)
  }

  /* ---- 2. pasta limpa ---- */

  passo(2, 'Limpando publicar/')
  await rm(SAIDA, { recursive: true, force: true })
  await mkdir(SAIDA, { recursive: true })

  /* ---- 3. landing page ---- */

  passo(3, 'Copiando a landing page')

  for (const item of DA_LANDING) {
    const origem = join(RAIZ, item)

    if (!(await existe(origem))) {
      console.warn(`    ⚠ ${item} não encontrado — pulando`)
      continue
    }

    await cp(origem, join(SAIDA, item), { recursive: true })
    console.log(`    · ${item}`)
  }

  /* ---- 4. painel ---- */

  passo(4, 'Copiando o painel para /admin')

  const dist = join(RAIZ, 'painel', 'dist')
  if (!(await existe(dist))) {
    console.error('\n✗ painel/dist não existe mesmo depois da construção.\n')
    process.exit(1)
  }

  await cp(dist, join(SAIDA, 'admin'), { recursive: true })

  /* confere se o build usou o base correto — o erro mais provável
     desta montagem, e silencioso: só apareceria como tela branca */
  const htmlPainel = await readFile(join(SAIDA, 'admin', 'index.html'), 'utf8')
  if (!htmlPainel.includes('/admin/assets/')) {
    console.error('\n✗ O painel foi construído sem base="/admin/".')
    console.error('  Confira o vite.config.ts e rode de novo — sem isso o')
    console.error('  painel publicado abre em branco.\n')
    process.exit(1)
  }
  console.log('    · base="/admin/" confirmado')

  /* ---- 5. regras da hospedagem ---- */

  passo(5, 'Gravando _redirects e _headers')
  await writeFile(join(SAIDA, '_redirects'), REDIRECTS, 'utf8')
  await writeFile(join(SAIDA, '_headers'), HEADERS, 'utf8')

  /* ---- 6. avisos do que ainda falta ---- */

  const pendencias = []

  if (!(await existe(join(SAIDA, 'assets', 'og-atelie-carla.jpg')))) {
    pendencias.push('assets/og-atelie-carla.jpg não existe — o link ' +
      'compartilhado no WhatsApp vai aparecer sem imagem. ' +
      'Gere em ferramentas/og-image.html.')
  }

  const htmlSite = await readFile(join(SAIDA, 'index.html'), 'utf8')
  if (htmlSite.includes('SEU-DOMINIO')) {
    pendencias.push('index.html ainda tem SEU-DOMINIO no lugar do domínio real.')
  }

  const catalogo = JSON.parse(await readFile(join(SAIDA, 'dados', 'catalogo.json'), 'utf8'))
  const semFoto = catalogo.categorias.filter((c) => !c.foto).length
  if (semFoto) {
    pendencias.push(`${semFoto} de ${catalogo.categorias.length} categorias ainda ` +
      'sem foto de capa — o site mostra o retângulo pastel no lugar.')
  }

  /* ---- pronto ---- */

  console.log('\n' + '='.repeat(38))
  console.log('✓ Pasta publicar/ pronta.\n')
  console.log('  Arraste a pasta inteira para:')
  console.log('    Netlify           → app.netlify.com/drop')
  console.log('    Cloudflare Pages  → dash.cloudflare.com › Workers e Pages › Upload')

  if (pendencias.length) {
    console.log('\n  Dá para publicar assim, mas repare:')
    for (const p of pendencias) console.log(`    ⚠ ${p}`)
  }

  console.log('')
}

principal().catch((erro) => {
  console.error('\n✗ ' + erro.message + '\n')
  process.exit(1)
})
