/* =========================================================
   Ateliê Carla Denise — interações da landing page
   ========================================================= */
(function () {
  'use strict';

  /* ---------------------------------------------------------
     Dados
     --------------------------------------------------------- */

  var CATEGORIAS = ['Design & Depilação', 'Micropigmentação', 'Olhos', 'Lábios', 'Retoques'];

  var ITENS = [
    { nome: 'Design de sobrancelhas', duracao: '30 min', preco: 'R$ 45', categoria: 'Design & Depilação' },
    { nome: 'Design + buço', duracao: '30 min', preco: 'R$ 55', categoria: 'Design & Depilação' },
    { nome: 'Design + buço + nariz', duracao: '30 min', preco: 'R$ 60', categoria: 'Design & Depilação' },
    { nome: 'Design com aplicação de henna', duracao: '30 min', preco: 'R$ 55', categoria: 'Design & Depilação' },
    { nome: 'Design e pintura dos pelos brancos', duracao: '30 min', preco: 'R$ 55', categoria: 'Design & Depilação' },
    { nome: 'Design + depilação facial', duracao: '35 min', preco: 'R$ 65', categoria: 'Design & Depilação' },
    { nome: 'Design + buço + nariz + henna', duracao: '30 min', preco: 'R$ 70', categoria: 'Design & Depilação' },
    { nome: 'Depilação facial completa', duracao: '30 min', preco: 'R$ 35', categoria: 'Design & Depilação' },
    { nome: 'Buço', duracao: '10 min', preco: 'R$ 15', categoria: 'Design & Depilação' },
    { nome: 'Nariz', duracao: '10 min', preco: 'R$ 10', categoria: 'Design & Depilação' },
    { nome: 'Orelha', duracao: '15 min', preco: 'R$ 5', categoria: 'Design & Depilação' },
    { nome: 'Brow lamination', duracao: '60 min', preco: 'R$ 120', categoria: 'Design & Depilação' },

    { nome: 'Microblading', duracao: '120 min', preco: 'R$ 400', categoria: 'Micropigmentação' },
    { nome: 'Nanoblading', duracao: '120 min', preco: 'R$ 400', categoria: 'Micropigmentação' },
    { nome: 'Micropigmentação shadow', duracao: '120 min', preco: 'R$ 400', categoria: 'Micropigmentação' },
    { nome: 'Correção de sobrancelhas · método Repigment', duracao: '150 min', preco: 'R$ 497', categoria: 'Micropigmentação' },

    { nome: 'Delineado dos olhos · superior', duracao: '60 min', preco: 'R$ 200', categoria: 'Olhos' },
    { nome: 'Delineado dos olhos · inferior', duracao: '60 min', preco: 'R$ 200', categoria: 'Olhos' },
    { nome: 'Delineado dos olhos · superior e inferior', duracao: '120 min', preco: 'R$ 399,90', categoria: 'Olhos' },

    { nome: 'Micropigmentação labial', duracao: '180 min', preco: 'R$ 450', categoria: 'Lábios' },
    { nome: 'Microlabial', duracao: '190 min', preco: 'R$ 450', categoria: 'Lábios' },

    { nome: 'Retoque de micro · 30 dias', duracao: '90 min', preco: 'R$ 150', categoria: 'Retoques' },
    { nome: 'Retoque sobrancelhas · 6 meses ou mais', duracao: '120 min', preco: 'R$ 400', categoria: 'Retoques' },
    { nome: 'Retoque dos olhos · 30 dias', duracao: '40 min', preco: 'R$ 80', categoria: 'Retoques' },
    { nome: 'Retoque labial · 45 dias', duracao: '120 min', preco: 'R$ 150', categoria: 'Retoques' }
  ];

  var RESUMOS = {
    'Design & Depilação': 'a partir de R$ 5 · 10 a 35 min',
    'Micropigmentação': 'a partir de R$ 400 · 2 a 2h30',
    'Olhos': 'a partir de R$ 200 · 1 a 2h',
    'Lábios': 'a partir de R$ 450 · 3h',
    'Retoques': 'a partir de R$ 80 · 40 a 120 min'
  };

  var SLOTS = {
    'Design & Depilação': 'foto design',
    'Micropigmentação': 'foto sobrancelha',
    'Olhos': 'foto delineado',
    'Lábios': 'foto lábios',
    'Retoques': 'foto retoque'
  };

  /* tons de fundo dos placeholders de imagem, ciclados por índice */
  var TONS = [
    'rgba(115,76,128,.12)',
    'rgba(250,240,220,.95)',
    'rgba(104,67,34,.12)',
    'rgba(196,196,196,.30)',
    'rgba(115,76,128,.07)'
  ];

  var RECURSOS = [
    { glifo: '✦', titulo: 'Desenho antes da agulha', texto: 'Desenho mapeado no seu rosto e aprovado por você antes de qualquer pigmento tocar a pele.' },
    { glifo: '◎', titulo: 'Pigmentos importados', texto: 'Linhas veganas e hipoalergênicas, com cicatrização previsível e sem virar cinza ou avermelhar.' },
    { glifo: '◧', titulo: 'Técnica sob medida', texto: 'Fio a fio, shadow, combo ou nano brows — a escolha vem do seu tipo de pele, não de moda.' },
    { glifo: '↑', titulo: 'Correção e neutralização', texto: 'Trabalho antigo saturado ou acinzentado? Protocolo de remoção e reconstrução em etapas seguras.' },
    { glifo: '≡', titulo: 'Biossegurança certificada', texto: 'Material descartável, sala esterilizada e ficha de anamnese completa. Registro na vigilância sanitária.' },
    { glifo: '◔', titulo: 'Retoque incluso em 30 dias', texto: 'Acompanhamento da cicatrização por mensagem e sessão de ajuste inclusa no valor do procedimento.' }
  ];

  /* ---------------------------------------------------------
     Utilitários
     --------------------------------------------------------- */

  function el(tag, className, texto) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (texto != null) node.textContent = texto;
    return node;
  }

  function itensDa(categoria) {
    return ITENS.filter(function (item) { return item.categoria === categoria; });
  }

  /* ---------------------------------------------------------
     Catálogo de procedimentos
     --------------------------------------------------------- */

  var catalogo = (function () {
    var cardsBox = document.querySelector('[data-catalogo-cards]');
    var itensBox = document.querySelector('[data-catalogo-itens]');
    var eyebrow = document.querySelector('[data-catalogo-eyebrow]');
    var titulo = document.querySelector('[data-catalogo-titulo]');
    var contagem = document.querySelector('[data-catalogo-contagem]');
    var voltar = document.querySelector('[data-catalogo-voltar]');

    if (!cardsBox || !itensBox) return null;

    /* aba = null → mostra as categorias; aba = nome → mostra a lista daquela categoria */
    var aba = null;

    function montarCards() {
      cardsBox.textContent = '';

      CATEGORIAS.forEach(function (nome, i) {
        var card = el('button', 'card');
        card.type = 'button';

        var thumb = el('div', 'card__thumb');
        /* backgroundColor, não o atalho background: preserva a textura riscada do CSS */
        thumb.style.backgroundColor = TONS[i % TONS.length];
        thumb.appendChild(el('span', null, SLOTS[nome]));

        var corpo = el('div', 'card__corpo');
        var bloco = el('div');
        bloco.appendChild(el('div', 'card__nome', nome));
        bloco.appendChild(el('div', 'card__resumo',
          RESUMOS[nome] + ' · ' + itensDa(nome).length + ' itens'));
        corpo.appendChild(bloco);

        var acao = el('span', 'card__acao');
        acao.appendChild(el('span', null, 'Ver valores'));
        acao.appendChild(el('span', null, '→'));
        corpo.appendChild(acao);

        card.appendChild(thumb);
        card.appendChild(corpo);
        card.addEventListener('click', function () { abrir(nome); });

        cardsBox.appendChild(card);
      });
    }

    function montarItens(categoria) {
      itensBox.textContent = '';

      itensDa(categoria).forEach(function (proc, i) {
        var linha = el('div', 'item');

        var thumb = el('div', 'item__thumb');
        thumb.style.backgroundColor = TONS[i % TONS.length];
        thumb.appendChild(el('span', null, 'foto'));

        var info = el('div', 'item__info');
        info.appendChild(el('div', 'item__nome', proc.nome));
        info.appendChild(el('div', 'item__duracao', proc.duracao));

        linha.appendChild(thumb);
        linha.appendChild(info);
        linha.appendChild(el('div', 'item__preco', proc.preco));

        itensBox.appendChild(linha);
      });
    }

    function render() {
      var listando = aba !== null;

      cardsBox.hidden = listando;
      itensBox.hidden = !listando;
      voltar.hidden = !listando;

      eyebrow.textContent = listando ? 'Categoria' : 'Tabela de valores';
      titulo.textContent = listando ? aba : 'Escolha uma categoria';

      if (listando) {
        var total = itensDa(aba).length;
        montarItens(aba);
        contagem.textContent = total + ' procedimentos em ' + aba.toLowerCase();
      } else {
        contagem.textContent = ITENS.length + ' procedimentos em ' + CATEGORIAS.length +
          ' categorias · valores de agosto/2026';
      }
    }

    function abrir(nome) {
      aba = nome;
      render();
      titulo.setAttribute('tabindex', '-1');
      titulo.focus();
    }

    voltar.addEventListener('click', function () {
      aba = null;
      render();
    });

    montarCards();
    render();

    return { abrir: abrir };
  })();

  /* ---------------------------------------------------------
     Grade de recursos (bloco escuro)
     --------------------------------------------------------- */

  (function () {
    var box = document.querySelector('[data-recursos]');
    if (!box) return;

    RECURSOS.forEach(function (r) {
      var item = el('div', 'recurso');
      var icone = el('div', 'recurso__icone', r.glifo);
      icone.setAttribute('aria-hidden', 'true');
      item.appendChild(icone);
      item.appendChild(el('div', 'recurso__titulo', r.titulo));
      item.appendChild(el('p', null, r.texto));
      box.appendChild(item);
    });
  })();

  /* ---------------------------------------------------------
     Menu mobile
     --------------------------------------------------------- */

  (function () {
    var toggle = document.querySelector('.menu-toggle');
    var menu = document.getElementById('menu-principal');
    if (!toggle || !menu) return;

    function fechar() {
      menu.classList.remove('aberto');
      toggle.setAttribute('aria-expanded', 'false');
    }

    toggle.addEventListener('click', function () {
      var aberto = menu.classList.toggle('aberto');
      toggle.setAttribute('aria-expanded', aberto ? 'true' : 'false');
    });

    /* fecha ao navegar para uma seção */
    menu.addEventListener('click', function (ev) {
      if (ev.target.closest('a')) fechar();
    });

    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') fechar();
    });
  })();
})();
