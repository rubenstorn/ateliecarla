/* =========================================================
   Ateliê Carla — ligação da landing page com o backend

   Carregado como módulo, depois do index.js. Tudo aqui é
   MELHORIA PROGRESSIVA: o HTML estático já está correto e
   completo antes deste arquivo rodar. Se o Supabase não estiver
   configurado, estiver fora do ar ou lento, a página continua
   exatamente como está — nenhum texto desaparece, nenhuma seção
   fica vazia.

   É por isso que as seções de vídeo e galeria começam com
   [hidden] no HTML: elas só aparecem se houver conteúdo
   publicado para mostrar.
   ========================================================= */

import { lerHero, lerVideos, lerMidias, enviarLead } from './conteudo.js';
import { configurado } from './cliente.js';

const $ = (s, r) => (r || document).querySelector(s);

function el(tag, classe, texto) {
  const n = document.createElement(tag);
  if (classe) n.className = classe;
  if (texto != null) n.textContent = texto;
  return n;
}

/* ---------------------------------------------------------
   HERO

   Reconstrói o título em duas linhas (parte normal + parte em
   destaque), mantendo a estrutura <span><span> que o CSS usa
   para a animação de subida linha por linha.

   Limitação conhecida: o HTML estático quebra o título em 4
   linhas escolhidas à mão; vindo do banco são 2. Para controle
   exato da quebra, use o script backend/publicar.js, que grava
   o texto direto no HTML.
   --------------------------------------------------------- */

function linha(texto, italico) {
  const fora = el('span');
  const dentro = el('span');

  if (italico) {
    const em = el('em', 'italico', texto);
    dentro.appendChild(em);
  } else {
    dentro.textContent = texto;
  }

  fora.appendChild(dentro);
  return fora;
}

async function aplicarHero() {
  const hero = await lerHero();
  if (!hero) return;

  const rotulo = $('.hero__rotulo');
  if (rotulo && hero.selo) rotulo.textContent = hero.selo;

  const texto = $('.hero__texto');
  if (texto && hero.subtitulo) texto.textContent = hero.subtitulo;

  const titulo = $('.hero__titulo');
  if (titulo && (hero.titulo || hero.titulo_destaque)) {
    titulo.textContent = '';
    if (hero.titulo) titulo.appendChild(linha(hero.titulo, false));
    if (hero.titulo_destaque) titulo.appendChild(linha(hero.titulo_destaque, true));
  }

  const botao = $('.hero__assinatura .botao--tinta');
  if (botao) {
    if (hero.cta_url) botao.href = hero.cta_url;
    if (hero.cta_texto) {
      /* preserva a seta: substitui só o primeiro nó de texto */
      const no = Array.from(botao.childNodes).find((n) => n.nodeType === 3 && n.textContent.trim());
      if (no) no.textContent = hero.cta_texto + ' ';
    }
  }
}

/* ---------------------------------------------------------
   GALERIA DE VÍDEOS
   --------------------------------------------------------- */

/* extrai o id do YouTube/Vimeo para montar o embed;
   URL desconhecida vira link simples, sem quebrar nada */
function embutir(url) {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}`;

  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;

  return null;
}

async function montarVideos() {
  const secao = $('[data-secao-videos]');
  const grade = $('[data-grade-videos]');
  if (!secao || !grade) return;

  const videos = await lerVideos();
  if (!videos.length) return;          /* seção continua oculta */

  grade.textContent = '';

  videos.forEach((v) => {
    const cartao = el('article', 'video-card');
    const moldura = el('div', 'video-card__moldura');
    const src = embutir(v.url);

    if (src) {
      /* só carrega o player quando a visitante clica: um iframe do
         YouTube custa ~1 MB e vários matariam o carregamento */
      const botao = el('button', 'video-card__play');
      botao.type = 'button';
      botao.setAttribute('aria-label', 'Assistir: ' + v.titulo);

      if (v.thumbnail_url) {
        const img = el('img');
        img.src = v.thumbnail_url;
        img.alt = '';
        img.loading = 'lazy';
        img.decoding = 'async';
        botao.appendChild(img);
      }

      botao.appendChild(el('span', 'video-card__disco'));

      botao.addEventListener('click', () => {
        const iframe = el('iframe');
        iframe.src = src + '?autoplay=1&rel=0';
        iframe.title = v.titulo;
        iframe.allow = 'accelerometer; autoplay; encrypted-media; picture-in-picture';
        iframe.allowFullscreen = true;
        iframe.loading = 'lazy';
        moldura.textContent = '';
        moldura.appendChild(iframe);
      });

      moldura.appendChild(botao);
    } else {
      const link = el('a', 'video-card__externo', 'Abrir vídeo ↗');
      link.href = v.url;
      link.target = '_blank';
      link.rel = 'noopener';
      moldura.appendChild(link);
    }

    cartao.appendChild(moldura);
    cartao.appendChild(el('h3', 'video-card__titulo', v.titulo));
    if (v.descricao) cartao.appendChild(el('p', 'video-card__texto', v.descricao));

    grade.appendChild(cartao);
  });

  secao.hidden = false;
}

/* ---------------------------------------------------------
   GALERIA DE IMAGENS
   --------------------------------------------------------- */

async function montarGaleria() {
  const secao = $('[data-secao-galeria]');
  const grade = $('[data-grade-galeria]');
  if (!secao || !grade) return;

  const midias = await lerMidias('galeria');
  if (!midias.length) return;

  grade.textContent = '';

  midias.forEach((m) => {
    const fig = el('figure', 'galeria-item');
    const img = el('img');
    img.src = m.imagem_url;
    img.alt = m.alt || m.titulo || '';
    img.loading = 'lazy';
    img.decoding = 'async';
    if (m.largura && m.altura) { img.width = m.largura; img.height = m.altura; }
    img.addEventListener('error', () => fig.remove());
    fig.appendChild(img);
    grade.appendChild(fig);
  });

  secao.hidden = false;
}

/* ---------------------------------------------------------
   FORMULÁRIO DE CONTATO (leads)
   --------------------------------------------------------- */

function ligarFormulario() {
  const form = $('[data-form-lead]');
  if (!form) return;

  const aviso = $('[data-lead-aviso]');
  const botao = $('[data-lead-enviar]');

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();

    /* campo-isca: humano não preenche o que não vê.
       Não substitui um captcha, mas barra robô simples. */
    if (form.querySelector('[name="_isca"]').value) return;

    aviso.hidden = true;
    aviso.removeAttribute('data-erro');
    botao.disabled = true;
    botao.textContent = 'Enviando…';

    const dados = new FormData(form);
    const r = await enviarLead({
      nome: dados.get('nome'),
      telefone: dados.get('telefone'),
      email: dados.get('email'),
      procedimento: dados.get('procedimento'),
      mensagem: dados.get('mensagem')
    });

    botao.disabled = false;
    botao.textContent = 'Quero ser chamada';
    aviso.hidden = false;

    if (r.ok) {
      form.reset();
      aviso.textContent = 'Recebido. A Carla vai te chamar no WhatsApp — normalmente no mesmo dia.';
    } else {
      aviso.textContent = r.erro;
      aviso.setAttribute('data-erro', '');
    }
  });

  /* máscara leve de telefone: não bloqueia digitação, só formata */
  const tel = form.querySelector('[name="telefone"]');
  tel.addEventListener('input', () => {
    const d = tel.value.replace(/\D/g, '').slice(0, 11);
    tel.value = d.length <= 10
      ? d.replace(/(\d{0,2})(\d{0,4})(\d{0,4})/, (_, a, b, c) =>
          [a && `(${a}`, a.length === 2 ? ') ' : '', b, c && `-${c}`].filter(Boolean).join(''))
      : d.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
  });
}

/* ---------------------------------------------------------
   Início

   O formulário é ligado sempre (ele avisa sozinho se o backend
   estiver fora). As leituras só acontecem se houver configuração,
   para não gastar requisição à toa.
   --------------------------------------------------------- */

ligarFormulario();

if (configurado()) {
  /* independentes: uma falha não impede as outras */
  aplicarHero().catch(() => {});
  montarVideos().catch(() => {});
  montarGaleria().catch(() => {});
}
