/* =========================================================
   Ateliê Carla Denise — variante "Catálogo v2"
   Loader, progresso de leitura, cabeçalho, menu em tela cheia,
   catálogo em categorias e revelações no scroll.
   ========================================================= */
(function () {
  'use strict';

  var AGENDA = 'https://agendaagil.com/ateliecarla';

  /* ---------------------------------------------------------
     Dados — categorias e seus procedimentos
     --------------------------------------------------------- */

  var CATEGORIAS = [
    {
      id: 'design-depilacao',
      titulo: 'Design & Depilação',
      etiqueta: 'foto design',
      precoPartir: 'R$ 5',
      tempo: '10 a 35 min',
      tom: 'rosa',
      itens: [
        { nome: 'Design de sobrancelhas', preco: 'R$ 45', duracao: '30 min', foto: 'foto design de sobrancelhas' },
        { nome: 'Design + buço', preco: 'R$ 55', duracao: '30 min', foto: 'foto design + buço' },
        { nome: 'Design + buço + nariz', preco: 'R$ 60', duracao: '30 min', foto: 'foto design + buço + nariz' },
        { nome: 'Design com aplicação de henna', preco: 'R$ 55', duracao: '30 min', foto: 'foto henna' },
        { nome: 'Design e pintura dos pelos brancos', preco: 'R$ 55', duracao: '30 min', foto: 'foto pelos brancos' },
        { nome: 'Design + depilação facial', preco: 'R$ 65', duracao: '35 min', foto: 'foto depilação facial' },
        { nome: 'Design + buço + nariz + henna', preco: 'R$ 70', duracao: '30 min', foto: 'foto combo henna' },
        { nome: 'Depilação facial completa', preco: 'R$ 35', duracao: '30 min', foto: 'foto facial completa' },
        { nome: 'Buço', preco: 'R$ 15', duracao: '10 min', foto: 'foto buço' },
        { nome: 'Nariz', preco: 'R$ 10', duracao: '10 min', foto: 'foto nariz' },
        { nome: 'Orelha', preco: 'R$ 5', duracao: '15 min', foto: 'foto orelha' },
        { nome: 'Brow lamination', preco: 'R$ 120', duracao: '60 min', foto: 'foto brow lamination' }
      ]
    },
    {
      id: 'micropigmentacao',
      titulo: 'Micropigmentação',
      etiqueta: 'foto sobrancelha',
      precoPartir: 'R$ 400',
      tempo: '2 a 2h30',
      tom: 'lilas',
      itens: [
        { nome: 'Microblading', preco: 'R$ 400', duracao: '120 min', foto: 'foto microblading' },
        { nome: 'Nanoblading', preco: 'R$ 400', duracao: '120 min', foto: 'foto nanoblading' },
        { nome: 'Micropigmentação shadow', preco: 'R$ 400', duracao: '120 min', foto: 'foto shadow' },
        { nome: 'Correção de sobrancelhas · método Repigment', preco: 'R$ 497', duracao: '150 min', foto: 'foto repigment' }
      ]
    },
    {
      id: 'olhos',
      titulo: 'Olhos',
      etiqueta: 'foto delineado',
      precoPartir: 'R$ 200',
      tempo: '1 a 2h',
      tom: 'azul',
      itens: [
        { nome: 'Delineado dos olhos · superior', preco: 'R$ 200', duracao: '60 min', foto: 'foto delineado superior' },
        { nome: 'Delineado dos olhos · inferior', preco: 'R$ 200', duracao: '60 min', foto: 'foto delineado inferior' },
        { nome: 'Delineado dos olhos · superior e inferior', preco: 'R$ 399,90', duracao: '120 min', foto: 'foto delineado completo' }
      ]
    },
    {
      id: 'labios',
      titulo: 'Lábios',
      etiqueta: 'foto lábios',
      precoPartir: 'R$ 450',
      tempo: '3h',
      tom: 'pink',
      itens: [
        { nome: 'Micropigmentação labial', preco: 'R$ 450', duracao: '180 min', foto: 'foto micro labial' },
        { nome: 'Microlabial', preco: 'R$ 450', duracao: '190 min', foto: 'foto microlabial' }
      ]
    },
    {
      id: 'retoques',
      titulo: 'Retoques',
      etiqueta: 'foto retoque',
      precoPartir: 'R$ 80',
      tempo: '40 a 120 min',
      tom: 'ambar',
      itens: [
        { nome: 'Retoque de micro · 30 dias', preco: 'R$ 150', duracao: '90 min', foto: 'foto retoque micro' },
        { nome: 'Retoque sobrancelhas · 6 meses ou mais', preco: 'R$ 400', duracao: '120 min', foto: 'foto retoque sobrancelhas' },
        { nome: 'Retoque dos olhos · 30 dias', preco: 'R$ 80', duracao: '40 min', foto: 'foto retoque olhos' },
        { nome: 'Retoque labial · 45 dias', preco: 'R$ 150', duracao: '120 min', foto: 'foto retoque labial' }
      ]
    }
  ];

  var $ = function (sel, raiz) { return (raiz || document).querySelector(sel); };
  var reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var criar = function (tag, classe, texto) {
    var el = document.createElement(tag);
    if (classe) el.className = classe;
    if (texto != null) el.textContent = texto;
    return el;
  };

  /* ---------------------------------------------------------
     Loader — contador irregular até 100% e véu que sobe
     --------------------------------------------------------- */

  (function loader() {
    var caixa = $('[data-loader]');
    if (!caixa) return;

    var barra = $('[data-loader-barra]', caixa);
    var pct = $('[data-loader-pct]', caixa);
    var valor = 0;

    var encerrar = function () {
      caixa.classList.add('pronto');
      setTimeout(function () { caixa.hidden = true; }, 1000);
    };

    if (reduzido) { encerrar(); return; }

    var passo = function () {
      valor = Math.min(100, valor + Math.random() * 13 + 5);
      barra.style.width = valor + '%';
      pct.textContent = Math.round(valor) + '%';
      if (valor >= 100) { setTimeout(encerrar, 420); return; }
      setTimeout(passo, 90);
    };
    setTimeout(passo, 260);
  }());

  /* ---------------------------------------------------------
     Cabeçalho e barra de progresso de leitura
     --------------------------------------------------------- */

  (function scroll() {
    var cabecalho = $('[data-cabecalho]');
    var progresso = $('[data-progresso]');
    var pendente = false;

    var medir = function () {
      pendente = false;
      var raiz = document.documentElement;
      var max = raiz.scrollHeight - raiz.clientHeight;
      var razao = max > 0 ? raiz.scrollTop / max : 0;
      progresso.style.transform = 'scaleX(' + razao.toFixed(4) + ')';
      cabecalho.classList.toggle('grudado', raiz.scrollTop >= 60);
    };

    window.addEventListener('scroll', function () {
      if (pendente) return;
      pendente = true;
      requestAnimationFrame(medir);
    }, { passive: true });

    medir();
  }());

  /* ---------------------------------------------------------
     Menu em tela cheia
     --------------------------------------------------------- */

  (function menu() {
    var botao = $('[data-menu-botao]');
    var painel = $('[data-menu]');
    var rotulo = $('[data-menu-rotulo]');
    if (!botao || !painel) return;

    var aberto = false;

    var definir = function (estado) {
      aberto = estado;
      if (estado) {
        painel.hidden = false;
        void painel.offsetWidth; // força o reflow para o clip-path animar a partir do estado fechado
      }
      painel.classList.toggle('aberto', estado);
      botao.setAttribute('aria-expanded', String(estado));
      rotulo.textContent = estado ? 'Fechar' : 'Menu';
      document.body.style.overflow = estado ? 'hidden' : '';
      if (!estado) setTimeout(function () { if (!aberto) painel.hidden = true; }, 1000);
    };

    botao.addEventListener('click', function () { definir(!aberto); });

    painel.addEventListener('click', function (ev) {
      if (ev.target.closest('a')) definir(false);
    });

    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && aberto) { definir(false); botao.focus(); }
    });
  }());

  /* ---------------------------------------------------------
     Catálogo — categorias › procedimentos › agendar
     --------------------------------------------------------- */

  (function catalogo() {
    var grade = $('[data-categorias]');
    var detalhe = $('[data-detalhe]');
    var contagem = $('[data-contagem]');
    var cta = $('[data-cta]');
    var ctaNome = $('[data-cta-nome]');
    var ctaMeta = $('[data-cta-meta]');
    var ctaLink = $('[data-cta-link]');
    var secao = $('#procedimentos');
    if (!grade || !detalhe) return;

    var escolhido = null;

    /* placeholder de foto: pastel + hachuras + etiqueta */
    var placeholder = function (rotulo, tom, classe) {
      var caixa = criar('div', 'placeholder placeholder--' + tom + (classe ? ' ' + classe : ''));
      caixa.setAttribute('role', 'img');
      caixa.setAttribute('aria-label', rotulo);
      caixa.appendChild(criar('span', 'placeholder__etiqueta', rotulo));
      return caixa;
    };

    var mostrarCta = function (item) {
      escolhido = item;
      if (!item) { cta.hidden = true; cta.classList.remove('visivel'); return; }
      ctaNome.textContent = item.nome;
      ctaMeta.textContent = item.preco + ' · ' + item.duracao;
      cta.hidden = false;
      void cta.offsetWidth;
      cta.classList.add('visivel');
    };

    /* ---- visão 1: grade de categorias ---- */

    var montarCard = function (cat) {
      var card = criar('article', 'card-cat');
      card.appendChild(placeholder(cat.etiqueta, cat.tom, 'placeholder--capa'));

      var corpo = criar('div', 'card-cat__corpo');
      corpo.appendChild(criar('h3', 'card-cat__titulo', cat.titulo));
      corpo.appendChild(criar('p', 'card-cat__meta',
        'a partir de ' + cat.precoPartir + ' · ' + cat.tempo + ' · ' + cat.itens.length + ' itens'));

      var botao = criar('button', 'card-cat__botao');
      botao.type = 'button';
      botao.setAttribute('aria-label', 'Ver valores de ' + cat.titulo);
      botao.append('Ver valores ');
      var seta = criar('span', null, '→');
      seta.setAttribute('aria-hidden', 'true');
      botao.appendChild(seta);
      botao.addEventListener('click', function () { abrirCategoria(cat); });
      corpo.appendChild(botao);

      card.appendChild(corpo);
      return card;
    };

    var mostrarCategorias = function () {
      detalhe.hidden = true;
      detalhe.textContent = '';
      grade.hidden = false;
      mostrarCta(null);
      var total = CATEGORIAS.reduce(function (s, c) { return s + c.itens.length; }, 0);
      contagem.textContent = total + ' procedimentos · valores de agosto/2026';
    };

    /* ---- visão 2: procedimentos da categoria ---- */

    var montarItem = function (cat, item) {
      var linha = criar('li');
      var botao = criar('button', 'item-proc');
      botao.type = 'button';
      botao.setAttribute('aria-pressed', 'false');

      botao.appendChild(placeholder(item.foto, cat.tom, 'placeholder--quadro'));

      var texto = criar('div', 'item-proc__texto');
      texto.appendChild(criar('h4', 'item-proc__nome', item.nome));
      var meta = criar('p', 'item-proc__meta');
      meta.appendChild(criar('span', 'item-proc__preco', item.preco));
      meta.append(' · ' + item.duracao);
      texto.appendChild(meta);
      botao.appendChild(texto);

      var marca = criar('span', 'item-proc__marca');
      marca.setAttribute('aria-hidden', 'true');
      botao.appendChild(marca);

      botao.addEventListener('click', function () {
        var jaEscolhido = escolhido && escolhido.nome === item.nome;
        Array.prototype.forEach.call(detalhe.querySelectorAll('.item-proc'), function (b) {
          b.setAttribute('aria-pressed', 'false');
        });
        botao.setAttribute('aria-pressed', String(!jaEscolhido));
        mostrarCta(jaEscolhido ? null : item);
      });

      linha.appendChild(botao);
      return linha;
    };

    var abrirCategoria = function (cat) {
      grade.hidden = true;
      detalhe.textContent = '';
      detalhe.hidden = false;
      mostrarCta(null);

      var voltar = criar('button', 'voltar');
      voltar.type = 'button';
      var setaVoltar = criar('span', null, '←');
      setaVoltar.setAttribute('aria-hidden', 'true');
      voltar.append(setaVoltar, ' Voltar para categorias');
      voltar.addEventListener('click', mostrarCategorias);
      detalhe.appendChild(voltar);

      var cabeca = criar('header', 'detalhe__cabeca');
      cabeca.appendChild(criar('h3', 'detalhe__titulo', cat.titulo));
      cabeca.appendChild(criar('p', 'detalhe__meta',
        'a partir de ' + cat.precoPartir + ' · ' + cat.tempo + ' · ' + cat.itens.length + ' itens'));
      detalhe.appendChild(cabeca);

      var lista = criar('ul', 'itens-proc');
      cat.itens.forEach(function (item) { lista.appendChild(montarItem(cat, item)); });
      detalhe.appendChild(lista);

      contagem.textContent = cat.itens.length + ' procedimentos em ' + cat.titulo;
      voltar.focus({ preventScroll: true });
      secao.scrollIntoView({ behavior: reduzido ? 'auto' : 'smooth', block: 'start' });
    };

    ctaLink.href = AGENDA;
    CATEGORIAS.forEach(function (cat) { grade.appendChild(montarCard(cat)); });
    mostrarCategorias();
  }());

  /* ---------------------------------------------------------
     Revelações no scroll
     --------------------------------------------------------- */

  (function revelar() {
    var alvos = document.querySelectorAll('.rv');

    if (reduzido || !('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(alvos, function (el) { el.classList.add('on'); });
      return;
    }

    var observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('on');
        observador.unobserve(e.target);
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });

    Array.prototype.forEach.call(alvos, function (el) { observador.observe(el); });

    // rede de segurança: se o observador não entregar nada (aba em segundo plano,
    // renderização suspensa), o conteúdo aparece mesmo assim.
    setTimeout(function () {
      if (document.querySelector('.rv.on')) return;
      observador.disconnect();
      Array.prototype.forEach.call(alvos, function (el) { el.classList.add('on'); });
    }, 2500);
  }());
}());
