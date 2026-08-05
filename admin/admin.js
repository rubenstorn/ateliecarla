/* =========================================================
   Ateliê Carla — painel administrativo

   Autenticação e escrita no banco. Nada aqui inventa segurança:
   quem decide o que este código pode fazer são as políticas de
   RLS do backend/schema.sql. Se alguém abrir este arquivo e
   tentar ler leads sem estar logado, o Postgres recusa.

   A senha nunca passa por este código além do formulário de
   login — quem cuida de hash, sessão e refresh token é o
   Supabase Auth.
   ========================================================= */

import { obterCliente, urlPublica, BUCKET, configurado } from '../api/cliente.js';

const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

let sb = null;
let leads = [];

/* ---------------------------------------------------------
   Utilidades
   --------------------------------------------------------- */

function el(tag, classe, texto) {
  const n = document.createElement(tag);
  if (classe) n.className = classe;
  if (texto != null) n.textContent = texto;
  return n;
}

let brindeTimer;
function avisar(msg, erro) {
  const b = $('[data-brinde]');
  b.textContent = msg;
  b.hidden = false;
  if (erro) b.setAttribute('data-erro', ''); else b.removeAttribute('data-erro');

  clearTimeout(brindeTimer);
  brindeTimer = setTimeout(() => { b.hidden = true; }, 3800);
}

function quando(iso) {
  const d = new Date(iso);
  const agora = Date.now();
  const min = Math.round((agora - d.getTime()) / 60000);

  if (min < 1) return 'agora';
  if (min < 60) return `${min} min`;
  if (min < 1440) return `${Math.round(min / 60)} h`;
  if (min < 10080) return `${Math.round(min / 1440)} d`;

  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

/* mostra quantos caracteres faltam nos campos com limite */
function ligarContadores() {
  $$('[data-contador]').forEach((span) => {
    const campo = $(`[name="${span.dataset.contador}"]`);
    if (!campo) return;

    const atualizar = () => {
      const max = campo.maxLength;
      span.textContent = `${campo.value.length}/${max}`;
      span.classList.toggle('longo', campo.value.length > max * 0.95);
    };

    campo.addEventListener('input', atualizar);
    atualizar();
  });
}

/* ---------------------------------------------------------
   Login e sessão
   --------------------------------------------------------- */

async function iniciar() {
  if (!configurado()) {
    $('[data-aviso-login]').hidden = false;
    $('[data-aviso-login]').textContent =
      'Supabase não configurado. Preencha api/config.js — instruções em backend/README.md.';
    $('[data-botao-entrar]').disabled = true;
    return;
  }

  sb = await obterCliente({ persistirSessao: true });
  if (!sb) {
    $('[data-aviso-login]').hidden = false;
    $('[data-aviso-login]').textContent = 'Não foi possível carregar a biblioteca do Supabase.';
    return;
  }

  const { data } = await sb.auth.getSession();
  if (data.session) abrirPainel(data.session);

  sb.auth.onAuthStateChange((evento, sessao) => {
    if (evento === 'SIGNED_OUT' || !sessao) mostrarLogin();
  });
}

$('[data-form-login]').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const aviso = $('[data-aviso-login]');
  const botao = $('[data-botao-entrar]');
  aviso.hidden = true;
  botao.disabled = true;
  botao.textContent = 'Entrando…';

  const email = ev.target.email.value.trim();
  const password = ev.target.senha.value;

  const { data, error } = await sb.auth.signInWithPassword({ email, password });

  botao.disabled = false;
  botao.textContent = 'Entrar';

  if (error) {
    aviso.hidden = false;
    /* mensagem genérica de propósito: não confirmar se o e-mail existe */
    aviso.textContent = 'E-mail ou senha incorretos.';
    return;
  }

  ev.target.senha.value = '';
  abrirPainel(data.session);
});

$('[data-sair]').addEventListener('click', async () => {
  await sb.auth.signOut();
  mostrarLogin();
});

function mostrarLogin() {
  $('[data-painel]').hidden = true;
  $('[data-entrada]').hidden = false;
}

async function abrirPainel(sessao) {
  $('[data-entrada]').hidden = true;
  $('[data-painel]').hidden = false;
  $('[data-usuario]').textContent = sessao.user.email;

  ligarContadores();

  await Promise.all([carregarLeads(), carregarHero(), carregarVideos(), carregarMidias(), carregarSeo()]);
}

/* ---------------------------------------------------------
   Abas
   --------------------------------------------------------- */

$$('.aba').forEach((aba) => {
  aba.addEventListener('click', () => {
    $$('.aba').forEach((a) => a.setAttribute('aria-selected', String(a === aba)));
    $$('.secao').forEach((s) => { s.hidden = s.dataset.secao !== aba.dataset.aba; });
  });
});

/* =========================================================
   LEADS
   ========================================================= */

async function carregarLeads() {
  const { data, error } = await sb
    .from('leads')
    .select('*')
    .order('criado_em', { ascending: false });

  if (error) { avisar('Erro ao carregar contatos: ' + error.message, true); return; }

  leads = data || [];
  desenharResumo();
  desenharLeads();
}

function desenharResumo() {
  const caixa = $('[data-resumo-leads]');
  caixa.textContent = '';

  const novos = leads.filter((l) => l.status === 'novo').length;
  const semana = leads.filter((l) => Date.now() - new Date(l.criado_em) < 6048e5).length;
  const agendados = leads.filter((l) => l.status === 'agendado' || l.status === 'atendido').length;

  const cartoes = [
    { valor: novos, rotulo: 'aguardando contato', destaque: true },
    { valor: semana, rotulo: 'nos últimos 7 dias' },
    { valor: agendados, rotulo: 'agendados ou atendidos' },
    { valor: leads.length, rotulo: 'total recebido' }
  ];

  cartoes.forEach((c) => {
    const cartao = el('div', 'cartao' + (c.destaque && c.valor ? ' cartao--destaque' : ''));
    cartao.appendChild(el('div', 'cartao__valor', String(c.valor)));
    cartao.appendChild(el('div', 'cartao__rotulo', c.rotulo));
    caixa.appendChild(cartao);
  });

  const contador = $('[data-contador-leads]');
  contador.textContent = novos || '';
  if (novos) contador.removeAttribute('data-zero'); else contador.setAttribute('data-zero', '');
}

function leadsFiltrados() {
  const status = $('[data-filtro-status]').value;
  const busca = $('[data-filtro-busca]').value.trim().toLowerCase();

  return leads.filter((l) => {
    if (status && l.status !== status) return false;
    if (!busca) return true;
    return (l.nome + ' ' + l.telefone).toLowerCase().includes(busca);
  });
}

function desenharLeads() {
  const corpo = $('[data-lista-leads]');
  corpo.textContent = '';

  const lista = leadsFiltrados();
  $('[data-vazio-leads]').hidden = lista.length > 0;

  lista.forEach((lead) => {
    const tr = el('tr');

    const td = (conteudo, classe) => {
      const c = el('td', classe);
      if (typeof conteudo === 'string') c.textContent = conteudo;
      else if (conteudo) c.appendChild(conteudo);
      return c;
    };

    tr.appendChild(td(quando(lead.criado_em), 'quando'));
    tr.appendChild(td(lead.nome));

    /* telefone clicável: no celular abre a ligação */
    const tel = el('a', null, lead.telefone);
    tel.href = 'tel:' + lead.telefone.replace(/\D/g, '');
    tr.appendChild(td(tel, 'tel'));

    tr.appendChild(td(lead.procedimento || '—'));

    /* status editável */
    const marca = el('span', 'marca-status');
    marca.setAttribute('data-s', lead.status);
    const sel = el('select');
    ['novo', 'contatado', 'agendado', 'atendido', 'perdido'].forEach((s) => {
      const o = el('option', null, s);
      o.value = s;
      if (s === lead.status) o.selected = true;
      sel.appendChild(o);
    });
    sel.addEventListener('change', async () => {
      const antes = lead.status;
      lead.status = sel.value;
      marca.setAttribute('data-s', sel.value);
      const ok = await salvarLead(lead.id, { status: sel.value });
      if (!ok) { lead.status = antes; sel.value = antes; marca.setAttribute('data-s', antes); }
      else desenharResumo();
    });
    const celStatus = el('td');
    celStatus.append(marca, sel);
    tr.appendChild(celStatus);

    /* anotações: salva ao sair do campo */
    const obs = el('input');
    obs.type = 'text';
    obs.value = lead.observacoes || '';
    obs.placeholder = 'anotação interna';
    obs.addEventListener('change', async () => {
      if (await salvarLead(lead.id, { observacoes: obs.value || null })) {
        lead.observacoes = obs.value;
      }
    });
    tr.appendChild(td(obs));

    /* WhatsApp direto, com mensagem pronta */
    const wa = el('a', 'botao botao--mini botao--fantasma', 'WhatsApp');
    wa.href = 'https://wa.me/55' + lead.telefone.replace(/\D/g, '') +
      '?text=' + encodeURIComponent(`Olá, ${lead.nome.split(' ')[0]}! Aqui é do Ateliê Carla Denise.`);
    wa.target = '_blank';
    wa.rel = 'noopener';
    wa.style.textDecoration = 'none';
    tr.appendChild(td(wa));

    corpo.appendChild(tr);
  });
}

async function salvarLead(id, campos) {
  const { error } = await sb.from('leads').update(campos).eq('id', id);
  if (error) { avisar('Não salvou: ' + error.message, true); return false; }
  avisar('Salvo');
  return true;
}

$('[data-filtro-status]').addEventListener('change', desenharLeads);
$('[data-filtro-busca]').addEventListener('input', desenharLeads);

/* exporta o que está filtrado na tela, não a tabela toda */
$('[data-exportar-leads]').addEventListener('click', () => {
  const lista = leadsFiltrados();
  if (!lista.length) { avisar('Nada para exportar', true); return; }

  const cabecalho = ['Data', 'Nome', 'Telefone', 'E-mail', 'Interesse', 'Mensagem', 'Origem', 'Status', 'Anotações'];

  /* o = ao início de célula é fórmula no Excel: prefixa com ' para neutralizar */
  const seguro = (v) => {
    const s = String(v == null ? '' : v);
    return /^[=+\-@]/.test(s) ? "'" + s : s;
  };
  const csv = (v) => '"' + seguro(v).replace(/"/g, '""') + '"';

  const linhas = lista.map((l) => [
    new Date(l.criado_em).toLocaleString('pt-BR'),
    l.nome, l.telefone, l.email, l.procedimento, l.mensagem, l.origem, l.status, l.observacoes
  ].map(csv).join(';'));

  /* BOM para o Excel abrir acentuação corretamente */
  const blob = new Blob(['﻿' + [cabecalho.map(csv).join(';'), ...linhas].join('\r\n')],
    { type: 'text/csv;charset=utf-8' });

  const a = el('a');
  a.href = URL.createObjectURL(blob);
  a.download = `contatos-atelie-carla-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
  avisar(`${lista.length} contato(s) exportado(s)`);
});

/* =========================================================
   HERO
   ========================================================= */

async function carregarHero() {
  const { data, error } = await sb.from('hero').select('*').eq('id', 1).maybeSingle();
  if (error) { avisar('Erro no hero: ' + error.message, true); return; }
  if (!data) return;

  const f = $('[data-form-hero]');
  ['selo', 'titulo', 'titulo_destaque', 'subtitulo', 'cta_texto', 'cta_url']
    .forEach((k) => { if (f[k]) f[k].value = data[k] || ''; });

  ligarContadores();
}

$('[data-form-hero]').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const f = ev.target;

  const { error } = await sb.from('hero').upsert({
    id: 1,
    selo: f.selo.value,
    titulo: f.titulo.value,
    titulo_destaque: f.titulo_destaque.value,
    subtitulo: f.subtitulo.value,
    cta_texto: f.cta_texto.value,
    cta_url: f.cta_url.value
  });

  if (error) { avisar('Não salvou: ' + error.message, true); return; }

  const marca = $('[data-salvo-hero]');
  marca.hidden = false;
  setTimeout(() => { marca.hidden = true; }, 2600);
  avisar('Abertura salva');
});

/* =========================================================
   VIDEOS
   ========================================================= */

async function carregarVideos() {
  const { data, error } = await sb
    .from('videos').select('*')
    .order('ordem', { ascending: true })
    .order('criado_em', { ascending: false });

  if (error) { avisar('Erro nos vídeos: ' + error.message, true); return; }

  const caixa = $('[data-lista-videos]');
  caixa.textContent = '';
  $('[data-vazio-videos]').hidden = (data || []).length > 0;

  (data || []).forEach((v) => caixa.appendChild(cartaoVideo(v)));
}

function cartaoVideo(v) {
  const item = el('div', 'item');
  if (!v.publicado) item.setAttribute('data-rascunho', '');

  const capa = el('div', 'item__capa');
  const thumb = urlPublica(v.thumbnail_url);
  if (thumb) {
    const img = el('img');
    img.src = thumb;
    img.alt = '';
    img.addEventListener('error', () => { img.remove(); capa.textContent = 'sem capa'; });
    capa.appendChild(img);
  } else {
    capa.textContent = 'sem capa';
  }
  item.appendChild(capa);

  const corpo = el('div', 'item__corpo');
  if (!v.publicado) corpo.appendChild(el('span', 'selo-rascunho', 'rascunho'));

  const mk = (rotulo, chave, tipo, max) => {
    const l = el('label', 'campo');
    l.appendChild(el('span', 'campo__rotulo', rotulo));
    const i = el(tipo === 'area' ? 'textarea' : 'input');
    if (tipo !== 'area') i.type = tipo;
    if (max) i.maxLength = max;
    i.value = v[chave] || '';
    i.addEventListener('change', async () => {
      const { error } = await sb.from('videos').update({ [chave]: i.value || null }).eq('id', v.id);
      if (error) avisar('Não salvou: ' + error.message, true);
      else { v[chave] = i.value; avisar('Salvo'); }
    });
    l.appendChild(i);
    return l;
  };

  corpo.appendChild(mk('Título', 'titulo', 'text', 200));
  corpo.appendChild(mk('Link do vídeo (YouTube, Vimeo…)', 'url', 'url', 500));
  corpo.appendChild(mk('URL da capa (opcional)', 'thumbnail_url', 'url', 500));
  item.appendChild(corpo);

  const acoes = el('div', 'item__acoes');

  const troca = el('label', 'interruptor');
  const chk = el('input');
  chk.type = 'checkbox';
  chk.checked = v.publicado;
  chk.addEventListener('change', async () => {
    if (chk.checked && !v.url) {
      chk.checked = false;
      avisar('Cole o link do vídeo antes de publicar', true);
      return;
    }
    const { error } = await sb.from('videos').update({ publicado: chk.checked }).eq('id', v.id);
    if (error) { chk.checked = !chk.checked; avisar('Não salvou: ' + error.message, true); return; }
    v.publicado = chk.checked;
    item.toggleAttribute('data-rascunho', !chk.checked);
    avisar(chk.checked ? 'Publicado no site' : 'Saiu do site');
    carregarVideos();
  });
  troca.append(chk, el('span', null, 'no site'));
  acoes.appendChild(troca);

  const apagar = el('button', 'botao botao--mini botao--perigo', 'Apagar');
  apagar.type = 'button';
  apagar.addEventListener('click', async () => {
    if (!confirm(`Apagar o vídeo "${v.titulo}"? Não tem como desfazer.`)) return;
    const { error } = await sb.from('videos').delete().eq('id', v.id);
    if (error) { avisar('Não apagou: ' + error.message, true); return; }
    avisar('Vídeo apagado');
    carregarVideos();
  });
  acoes.appendChild(apagar);

  item.appendChild(acoes);
  return item;
}

$('[data-novo-video]').addEventListener('click', async () => {
  const { error } = await sb.from('videos').insert({
    titulo: 'Novo vídeo', url: '', publicado: false, ordem: 99
  });
  if (error) { avisar('Não criou: ' + error.message, true); return; }
  avisar('Vídeo criado como rascunho');
  carregarVideos();
});

/* =========================================================
   MIDIAS — upload e gestão
   ========================================================= */

async function carregarMidias() {
  const { data, error } = await sb
    .from('midias').select('*')
    .order('ordem', { ascending: true })
    .order('criado_em', { ascending: false });

  if (error) { avisar('Erro nas imagens: ' + error.message, true); return; }

  const caixa = $('[data-lista-midias]');
  caixa.textContent = '';
  $('[data-vazio-midias]').hidden = (data || []).length > 0;

  (data || []).forEach((m) => caixa.appendChild(cartaoMidia(m)));
}

function cartaoMidia(m) {
  const foto = el('div', 'foto');
  if (!m.publicado) foto.setAttribute('data-rascunho', '');

  const img = el('img');
  img.src = urlPublica(m.imagem_url) || '';
  img.alt = m.alt || '';
  img.loading = 'lazy';
  foto.appendChild(img);

  const corpo = el('div', 'foto__corpo');
  corpo.appendChild(el('div', 'foto__nome', m.titulo));
  corpo.appendChild(el('div', 'foto__meta',
    `${m.grupo}${m.largura ? ` · ${m.largura}×${m.altura}` : ''}`));

  /* alt é acessibilidade: fica editável e visível */
  const lAlt = el('label', 'campo');
  lAlt.appendChild(el('span', 'campo__rotulo', 'Descrição da imagem'));
  const iAlt = el('input');
  iAlt.type = 'text';
  iAlt.maxLength = 300;
  iAlt.value = m.alt || '';
  iAlt.addEventListener('change', async () => {
    const { error } = await sb.from('midias').update({ alt: iAlt.value }).eq('id', m.id);
    if (error) avisar('Não salvou: ' + error.message, true);
    else { m.alt = iAlt.value; img.alt = iAlt.value; avisar('Salvo'); }
  });
  lAlt.appendChild(iAlt);
  corpo.appendChild(lAlt);

  const acoes = el('div', 'foto__acoes');

  const troca = el('label', 'interruptor');
  const chk = el('input');
  chk.type = 'checkbox';
  chk.checked = m.publicado;
  chk.addEventListener('change', async () => {
    const { error } = await sb.from('midias').update({ publicado: chk.checked }).eq('id', m.id);
    if (error) { chk.checked = !chk.checked; avisar('Não salvou: ' + error.message, true); return; }
    m.publicado = chk.checked;
    foto.toggleAttribute('data-rascunho', !chk.checked);
    avisar(chk.checked ? 'No site' : 'Fora do site');
  });
  troca.append(chk, el('span', null, 'no site'));
  acoes.appendChild(troca);

  const apagar = el('button', 'botao botao--mini botao--perigo', 'Apagar');
  apagar.type = 'button';
  apagar.addEventListener('click', async () => {
    if (!confirm(`Apagar "${m.titulo}"? O arquivo sai do armazenamento também.`)) return;

    /* apaga o arquivo antes do registro: se falhar, o registro
       continua e a imagem não vira órfã invisível */
    if (m.imagem_url && !/^https?:\/\//.test(m.imagem_url)) {
      const { error: erroArquivo } = await sb.storage.from(BUCKET).remove([m.imagem_url]);
      if (erroArquivo) { avisar('Não apagou o arquivo: ' + erroArquivo.message, true); return; }
    }

    const { error } = await sb.from('midias').delete().eq('id', m.id);
    if (error) { avisar('Não apagou o registro: ' + error.message, true); return; }
    avisar('Imagem apagada');
    carregarMidias();
  });
  acoes.appendChild(apagar);

  corpo.appendChild(acoes);
  foto.appendChild(corpo);
  return foto;
}

/* ---- upload ---- */

const solta = $('[data-solta]');
const campoArquivo = $('[data-arquivo]');

solta.addEventListener('click', () => campoArquivo.click());
solta.addEventListener('keydown', (ev) => {
  if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); campoArquivo.click(); }
});

['dragenter', 'dragover'].forEach((e) =>
  solta.addEventListener(e, (ev) => { ev.preventDefault(); solta.classList.add('ativo'); }));
['dragleave', 'drop'].forEach((e) =>
  solta.addEventListener(e, () => solta.classList.remove('ativo')));

solta.addEventListener('drop', (ev) => {
  ev.preventDefault();
  enviarArquivos(Array.from(ev.dataTransfer.files));
});

campoArquivo.addEventListener('change', () => {
  enviarArquivos(Array.from(campoArquivo.files));
  campoArquivo.value = '';
});

/* mede a imagem antes de enviar, para gravar largura/altura e
   evitar salto de layout no site */
function medir(arquivo) {
  return new Promise((ok) => {
    const url = URL.createObjectURL(arquivo);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); ok({ largura: img.naturalWidth, altura: img.naturalHeight }); };
    img.onerror = () => { URL.revokeObjectURL(url); ok({ largura: null, altura: null }); };
    img.src = url;
  });
}

function nomeSeguro(nome) {
  return nome
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')   /* tira acento */
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(-80);
}

async function enviarArquivos(arquivos) {
  const imagens = arquivos.filter((a) => a.type.startsWith('image/'));
  if (!imagens.length) { avisar('Escolha arquivos de imagem', true); return; }

  const grupo = $('[data-grupo-upload]').value;
  const caixa = $('[data-progresso-upload]');
  const barra = $('[data-progresso-barra]');
  caixa.hidden = false;

  let feitos = 0;

  for (const arquivo of imagens) {
    if (arquivo.size > 5 * 1024 * 1024) {
      avisar(`${arquivo.name} passa de 5 MB e foi ignorado`, true);
      feitos++;
      continue;
    }

    const { largura, altura } = await medir(arquivo);
    const caminho = `${grupo}/${Date.now()}-${nomeSeguro(arquivo.name)}`;

    const { error: erroUp } = await sb.storage
      .from(BUCKET)
      .upload(caminho, arquivo, { cacheControl: '31536000', upsert: false });

    if (erroUp) {
      avisar(`Falhou o envio de ${arquivo.name}: ${erroUp.message}`, true);
      feitos++;
      continue;
    }

    const { error: erroReg } = await sb.from('midias').insert({
      titulo: arquivo.name.replace(/\.[^.]+$/, ''),
      imagem_url: caminho,
      alt: '',
      grupo,
      largura,
      altura,
      publicado: false
    });

    /* se o registro falhar, remove o arquivo para não deixar lixo */
    if (erroReg) {
      await sb.storage.from(BUCKET).remove([caminho]);
      avisar(`Enviou mas não registrou ${arquivo.name}: ${erroReg.message}`, true);
    }

    feitos++;
    barra.style.width = `${Math.round((feitos / imagens.length) * 100)}%`;
  }

  setTimeout(() => { caixa.hidden = true; barra.style.width = '0'; }, 900);
  avisar(`${imagens.length} imagem(ns) enviada(s) como rascunho. Marque "no site" para publicar.`);
  carregarMidias();
}

/* =========================================================
   SEO
   ========================================================= */

async function carregarSeo() {
  const { data, error } = await sb.from('seo').select('*').eq('id', 1).maybeSingle();
  if (error) { avisar('Erro no SEO: ' + error.message, true); return; }
  if (!data) return;

  const f = $('[data-form-seo]');
  ['meta_title', 'meta_description', 'og_image_url', 'canonical_url']
    .forEach((k) => { if (f[k]) f[k].value = data[k] || ''; });

  ligarContadores();
}

$('[data-form-seo]').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const f = ev.target;

  const { error } = await sb.from('seo').upsert({
    id: 1,
    meta_title: f.meta_title.value,
    meta_description: f.meta_description.value,
    og_image_url: f.og_image_url.value,
    canonical_url: f.canonical_url.value
  });

  if (error) { avisar('Não salvou: ' + error.message, true); return; }

  const marca = $('[data-salvo-seo]');
  marca.hidden = false;
  setTimeout(() => { marca.hidden = true; }, 2600);
  avisar('SEO salvo. Rode node backend/publicar.js para aplicar no site.');
});

/* --------------------------------------------------------- */

iniciar();
