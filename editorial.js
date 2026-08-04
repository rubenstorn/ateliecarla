/* =========================================================
   Ateliê Carla Denise — versão editorial
   Catálogo por abas, revelação de texto no scroll e menu mobile.
   ========================================================= */
(function () {
  'use strict';

  var reduzirMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------
     Dados dos procedimentos
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
    'Micropigmentação': 'a partir de R$ 400 · 2h a 2h30',
    'Olhos': 'a partir de R$ 200 · 1h a 2h',
    'Lábios': 'a partir de R$ 450 · 3h',
    'Retoques': 'a partir de R$ 80 · 40 a 120 min'
  };

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

  function doisDigitos(n) {
    return n < 10 ? '0' + n : String(n);
  }

  /* ---------------------------------------------------------
     Catálogo por abas
     --------------------------------------------------------- */

  (function () {
    var abasBox = document.querySelector('[data-catalogo-abas]');
    var tabelaBox = document.querySelector('[data-catalogo-tabela]');
    var contagem = document.querySelector('[data-catalogo-contagem]');
    if (!abasBox || !tabelaBox) return;

    var ABAS = ['Todos'].concat(CATEGORIAS);
    var atual = 'Todos';
    var botoes = [];

    function linha(proc, indice) {
      var item = el('div', 'linha');
      item.appendChild(el('span', 'linha__num', doisDigitos(indice)));
      item.appendChild(el('span', 'linha__nome', proc.nome));
      item.appendChild(el('span', 'linha__duracao', proc.duracao));
      item.appendChild(el('span', 'linha__preco', proc.preco));
      return item;
    }

    function grupo(categoria) {
      var bloco = el('div', 'tabela__grupo');
      var titulo = el('p', 'rotulo', categoria + ' · ' + RESUMOS[categoria]);
      bloco.appendChild(titulo);

      itensDa(categoria).forEach(function (proc, i) {
        bloco.appendChild(linha(proc, i + 1));
      });

      return bloco;
    }

    function render() {
      tabelaBox.textContent = '';

      var categorias = atual === 'Todos' ? CATEGORIAS : [atual];
      categorias.forEach(function (categoria) {
        tabelaBox.appendChild(grupo(categoria));
      });

      var total = categorias.reduce(function (soma, categoria) {
        return soma + itensDa(categoria).length;
      }, 0);

      if (contagem) {
        contagem.textContent = atual === 'Todos'
          ? total + ' procedimentos em ' + CATEGORIAS.length + ' categorias'
          : total + ' procedimentos em ' + atual.toLowerCase();
      }

      botoes.forEach(function (botao) {
        var ativo = botao.dataset.aba === atual;
        botao.setAttribute('aria-selected', ativo ? 'true' : 'false');
        botao.tabIndex = ativo ? 0 : -1;
      });
    }

    ABAS.forEach(function (nome) {
      var botao = el('button', 'aba', nome);
      botao.type = 'button';
      botao.dataset.aba = nome;
      botao.setAttribute('role', 'tab');
      botao.addEventListener('click', function () {
        atual = nome;
        render();
      });
      botoes.push(botao);
      abasBox.appendChild(botao);
    });

    /* navegação por setas entre as abas */
    abasBox.addEventListener('keydown', function (ev) {
      var indice = botoes.indexOf(document.activeElement);
      if (indice < 0) return;

      var passo = ev.key === 'ArrowRight' ? 1 : ev.key === 'ArrowLeft' ? -1 : 0;
      if (!passo) return;

      ev.preventDefault();
      var alvo = botoes[(indice + passo + botoes.length) % botoes.length];
      alvo.focus();
      alvo.click();
    });

    render();
  })();

  /* ---------------------------------------------------------
     Revelação no scroll
     palavra por palavra em [data-reveal], bloco em [data-surge]
     --------------------------------------------------------- */

  (function () {
    var alvos = document.querySelectorAll('[data-reveal], [data-surge]');
    if (!alvos.length) return;

    if (reduzirMovimento || !('IntersectionObserver' in window)) {
      alvos.forEach(function (node) { node.classList.add('visivel'); });
      return;
    }

    /* quebra o texto em palavras mantendo o <em> do meio da frase */
    function fatiar(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (filho) {
        if (filho.nodeType === 3) {
          var partes = filho.textContent.split(/(\s+)/);
          var frag = document.createDocumentFragment();

          partes.forEach(function (parte) {
            if (!parte) return;
            if (/^\s+$/.test(parte)) {
              frag.appendChild(document.createTextNode(parte));
            } else {
              frag.appendChild(el('span', 'palavra', parte));
            }
          });

          filho.parentNode.replaceChild(frag, filho);
        } else if (filho.nodeType === 1) {
          fatiar(filho);
        }
      });
    }

    document.querySelectorAll('[data-reveal]').forEach(function (node) {
      fatiar(node);
      node.querySelectorAll('.palavra').forEach(function (palavra, i) {
        palavra.style.transitionDelay = Math.min(i * 45, 900) + 'ms';
      });
    });

    var disparou = false;

    var observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        disparou = true;
        if (!entrada.isIntersecting) return;
        entrada.target.classList.add('visivel');
        observador.unobserve(entrada.target);
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });

    alvos.forEach(function (node) { observador.observe(node); });

    /* rede de segurança: se o observer não responder (aba em segundo plano,
       navegador sem composição, erro de layout), mostra tudo sem animação —
       nunca vale a pena deixar o conteúdo invisível. */
    window.setTimeout(function () {
      if (disparou) return;
      observador.disconnect();
      alvos.forEach(function (node) { node.classList.add('visivel'); });
    }, 1600);
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

    menu.addEventListener('click', function (ev) {
      if (ev.target.closest('a')) fechar();
    });

    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') fechar();
    });
  })();

  /* ---------------------------------------------------------
     Hairline do cabeçalho após rolar
     --------------------------------------------------------- */

  (function () {
    var cabecalho = document.querySelector('[data-cabecalho]');
    if (!cabecalho) return;

    function atualizar() {
      cabecalho.classList.toggle('rolou', window.scrollY > 12);
    }

    window.addEventListener('scroll', atualizar, { passive: true });
    atualizar();
  })();
})();
