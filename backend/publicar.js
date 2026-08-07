#!/usr/bin/env node
/* =========================================================
   Ateliê Carla — publicar conteúdo do banco no HTML

   Lê as tabelas "seo" e "hero" do Supabase e grava os valores
   direto no index.html, entre os marcadores @gerado.

   POR QUE ISTO EXISTE
   Buscadores e os robôs de prévia do WhatsApp, Instagram e
   Facebook não executam JavaScript. Meta tag aplicada no
   navegador é invisível para eles. A única forma de o título e a
   imagem de compartilhamento realmente funcionarem é estarem
   escritos no arquivo — e é isso que este script faz.

   USO
     node backend/publicar.js            grava as alterações
     node backend/publicar.js --conferir  só mostra o que mudaria

   Sem dependências: usa fetch nativo (Node 18+) e a API REST do
   Supabase. Não precisa de npm install.
   ========================================================= */

import { readFile, writeFile, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, '..');
const HTML = join(RAIZ, 'index.html');

const conferir = process.argv.includes('--conferir');

/* ---------------------------------------------------------
   Configuração: lida do api/config.js, para não duplicar
   --------------------------------------------------------- */

async function lerConfig() {
  const { SUPABASE_URL, SUPABASE_ANON_KEY, configurado } =
    await import(new URL('../api/config.js', import.meta.url));

  if (!configurado()) {
    console.error('\n✗ Supabase não configurado.');
    console.error('  Preencha SUPABASE_URL e SUPABASE_ANON_KEY em api/config.js.');
    console.error('  Painel do Supabase › Project Settings › API.\n');
    process.exit(1);
  }

  return { url: SUPABASE_URL, chave: SUPABASE_ANON_KEY };
}

/* ---------------------------------------------------------
   Leitura via API REST (as políticas de RLS permitem SELECT
   público em hero e seo — ver schema.sql)
   --------------------------------------------------------- */

async function buscar(cfg, tabela, colunas) {
  const endereco = `${cfg.url}/rest/v1/${tabela}?select=${colunas}&id=eq.1`;

  const r = await fetch(endereco, {
    headers: {
      apikey: cfg.chave,
      Authorization: `Bearer ${cfg.chave}`,
      Accept: 'application/json'
    }
  });

  if (!r.ok) {
    throw new Error(`${tabela}: HTTP ${r.status} — ${(await r.text()).slice(0, 200)}`);
  }

  const linhas = await r.json();
  if (!linhas.length) throw new Error(`${tabela}: nenhuma linha com id = 1. Rodou o seed.sql?`);

  return linhas[0];
}

/* ---------------------------------------------------------
   Escape de HTML — obrigatório: o conteúdo vem do banco e vai
   para dentro de atributos. Sem isto, um aspas duplas no
   título quebraria a meta tag.
   --------------------------------------------------------- */

function esc(valor) {
  return String(valor == null ? '' : valor)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ---------------------------------------------------------
   Substituição por marcador

   Recorta entre <!-- @gerado:nome --> e <!-- @/gerado:nome -->,
   preservando os próprios marcadores. Nada de regex sobre a
   estrutura do HTML.
   --------------------------------------------------------- */

function trocarBloco(html, nome, novoConteudo) {
  const abre = `<!-- @gerado:${nome}`;
  const fecha = `<!-- @/gerado:${nome} -->`;

  const i = html.indexOf(abre);
  const f = html.indexOf(fecha);

  if (i === -1 || f === -1) {
    throw new Error(
      `marcador "${nome}" não encontrado no index.html.\n` +
      `  Esperado: ${abre} ... ${fecha}\n` +
      `  Se você reescreveu o HTML, recoloque os marcadores.`
    );
  }

  /* o comentário de abertura tem texto explicativo dentro dele;
     preservamos tudo até o fim daquele comentário */
  const fimDoComentario = html.indexOf('-->', i) + 3;

  return html.slice(0, fimDoComentario) + '\n' + novoConteudo + '\n' + html.slice(f);
}

/* ---------------------------------------------------------
   Montagem dos blocos
   --------------------------------------------------------- */

function blocoSeo(seo) {
  const titulo = esc(seo.meta_title);
  const descricao = esc(seo.meta_description);
  const ogTitulo = esc(seo.og_title);
  const ogDescricao = esc(seo.og_description);
  const imagem = esc(seo.og_image_url);
  const canonica = esc(seo.canonical_url);

  return `<title>${titulo}</title>
<meta name="description" content="${descricao}">
<link rel="canonical" href="${canonica}">

<meta property="og:type" content="website">
<meta property="og:locale" content="pt_BR">
<meta property="og:site_name" content="Ateliê Carla Denise">
<meta property="og:url" content="${canonica}">
<meta property="og:title" content="${ogTitulo}">
<meta property="og:description" content="${ogDescricao}">
<meta property="og:image" content="${imagem}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Ateliê Carla Denise · micropigmentação e design de sobrancelhas em Goiânia">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${ogTitulo}">
<meta name="twitter:description" content="${ogDescricao}">
<meta name="twitter:image" content="${imagem}">`;
}

function blocoHero(hero) {
  const linhas = [];

  /* quebra a primeira parte em no máximo 3 linhas de tamanho
     parecido, para o título não virar um bloco único gigante */
  const palavras = String(hero.titulo || '').trim().split(/\s+/).filter(Boolean);

  if (palavras.length) {
    const porLinha = Math.ceil(palavras.length / Math.min(3, Math.ceil(palavras.length / 2)));
    for (let i = 0; i < palavras.length; i += porLinha) {
      linhas.push(`      <span><span>${esc(palavras.slice(i, i + porLinha).join(' '))}</span></span>`);
    }
  }

  if (hero.titulo_destaque) {
    linhas.push(`      <span><span><em class="italico">${esc(hero.titulo_destaque)}</em></span></span>`);
  }

  return `    <h1 class="hero__titulo">\n${linhas.join('\n')}\n    </h1>`;
}

/* ---------------------------------------------------------
   Principal
   --------------------------------------------------------- */

async function principal() {
  const cfg = await lerConfig();

  console.log('· lendo o banco…');
  const [seo, hero] = await Promise.all([
    buscar(cfg, 'seo', 'meta_title,meta_description,og_title,og_description,og_image_url,canonical_url'),
    buscar(cfg, 'hero', 'titulo,titulo_destaque')
  ]);

  /* og_title/og_description são opcionais: quando vazios, o card social
     usa o mesmo texto do título/descrição de busca. Preenchê-los no
     painel permite um texto mais forte para WhatsApp/Instagram sem
     mexer no <title> que aparece no Google. */
  seo.og_title = seo.og_title || seo.meta_title;
  seo.og_description = seo.og_description || seo.meta_description;

  /* avisos de qualidade — o script não bloqueia, só alerta */
  if (!seo.meta_title) console.warn('⚠ meta_title está vazio no banco');
  if (!seo.og_image_url) console.warn('⚠ og_image_url está vazio: o link não terá imagem no WhatsApp');
  if (seo.canonical_url.includes('SEU-DOMINIO')) {
    console.warn('⚠ canonical_url ainda é o domínio de exemplo — corrija no painel, aba SEO');
  }
  if (seo.meta_title.length > 60) {
    console.warn(`⚠ meta_title tem ${seo.meta_title.length} caracteres; o Google corta em ~60`);
  }

  const original = await readFile(HTML, 'utf8');
  let html = trocarBloco(original, 'seo', blocoSeo(seo));
  html = trocarBloco(html, 'hero-titulo', blocoHero(hero));

  if (html === original) {
    console.log('\n✓ nada a mudar: o HTML já está igual ao banco.\n');
    return;
  }

  if (conferir) {
    console.log('\n— modo conferência, nada foi gravado —');
    console.log(`  título:    ${seo.meta_title}`);
    console.log(`  descrição: ${seo.meta_description.slice(0, 80)}…`);
    console.log(`  og:título: ${seo.og_title}`);
    console.log(`  og:desc.:  ${seo.og_description.slice(0, 80)}…`);
    console.log(`  imagem:    ${seo.og_image_url}`);
    console.log(`  canônica:  ${seo.canonical_url}`);
    console.log(`  hero:      ${hero.titulo} / ${hero.titulo_destaque}`);
    console.log('\n  Rode sem --conferir para gravar.\n');
    return;
  }

  /* cópia de segurança antes de escrever */
  await copyFile(HTML, HTML + '.bak');
  await writeFile(HTML, html, 'utf8');

  console.log('\n✓ index.html atualizado (cópia anterior em index.html.bak)');
  console.log('  Agora publique o site para as mudanças chegarem no ar.\n');
}

principal().catch((erro) => {
  console.error('\n✗ ' + erro.message + '\n');
  process.exit(1);
});
