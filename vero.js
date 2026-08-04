/* =========================================================
   Ateliê Carla Denise — variante "Vero"
   Catálogo, carrossel, marquee e animações de entrada.
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

  /* resumo mostrado à direita do nome de cada categoria na tabela */
  var RESUMOS = {
    'Design & Depilação': 'a partir de R$ 5 · 10 a 35 min',
    'Micropigmentação': 'a partir de R$ 400 · 2h a 2h30',
    'Olhos': 'a partir de R$ 200 · 1h a 2h',
    'Lábios': 'a partir de R$ 450 · 3h',
    'Retoques': 'a partir de R$ 80 · 40 a 120 min'
  };

  var COMPROMISSOS = [
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

  function doisDigitos(n) {
    return n < 10 ? '0' + n : String(n);
  }

  /* ---------------------------------------------------------
     Catálogo de procedimentos
     --------------------------------------------------------- */

  (function () {
    var abasBox = document.querySelector('[data-catalogo-abas]');
    var tabelaBox = document.querySelector('[data-catalogo-tabela]');
    var contagem = document.querySelector('[data-catalogo-contagem]');
    if (!abasBox || !tabelaBox) return;

    var ABAS = ['Todos'].concat(CATEGORIAS);
    var atual = 'Todos';
    var botoes = [];

    function montarGrupo(categoria) {
      var grupo = el('div', 'grupo');

      var titulo = el('h3', 'grupo__titulo');
      titulo.appendChild(el('span', null, categoria));
      titulo.appendChild(el('span', 'rotulo', RESUMOS[categoria]));
      grupo.appendChild(titulo);

      itensDa(categoria).forEach(function (proc, i) {
        var linha = el('div', 'linha');
        linha.appendChild(el('span', 'linha__num', doisDigitos(i + 1)));
        linha.appendChild(el('span', 'linha__nome', proc.nome));
        linha.appendChild(el('span', 'linha__duracao', proc.duracao));
        linha.appendChild(el('span', 'linha__preco', proc.preco));
        grupo.appendChild(linha);
      });

      return grupo;
    }

    function render() {
      tabelaBox.textContent = '';

      var lista = atual === 'Todos' ? CATEGORIAS : [atual];
      lista.forEach(function (categoria) {
        tabelaBox.appendChild(montarGrupo(categoria));
      });

      botoes.forEach(function (botao) {
        botao.setAttribute('aria-selected', botao.dataset.aba === atual ? 'true' : 'false');
      });

      if (!contagem) return;
      contagem.textContent = atual === 'Todos'
        ? ITENS.length + ' procedimentos · ' + CATEGORIAS.length + ' categorias'
        : itensDa(atual).length + ' procedimentos em ' + atual.toLowerCase();
    }

    ABAS.forEach(function (nome) {
      var botao = el('button', 'aba', nome);
      botao.type = 'button';
      botao.setAttribute('role', 'tab');
      botao.dataset.aba = nome;
      botao.addEventListener('click', function () {
        atual = nome;
        render();
      });
      abasBox.appendChild(botao);
      botoes.push(botao);
    });

    render();
  })();

  /* ---------------------------------------------------------
     Compromissos do ateliê
     --------------------------------------------------------- */

  (function () {
    var box = document.querySelector('[data-cuidado]');
    if (!box) return;

    COMPROMISSOS.forEach(function (c) {
      var item = el('div', 'compromisso');
      item.setAttribute('data-surge', '');

      var glifo = el('div', 'compromisso__glifo', c.glifo);
      glifo.setAttribute('aria-hidden', 'true');

      item.appendChild(glifo);
      item.appendChild(el('h3', 'compromisso__titulo', c.titulo));
      item.appendChild(el('p', null, c.texto));
      box.appendChild(item);
    });
  })();

  /* ---------------------------------------------------------
     Marquee — duplica a trilha para o loop de -50% fechar
     --------------------------------------------------------- */

  (function () {
    var trilha = document.querySelector('[data-marquee]');
    if (!trilha) return;

    var original = Array.prototype.slice.call(trilha.children);
    original.forEach(function (node) {
      trilha.appendChild(node.cloneNode(true));
    });
  })();

  /* ---------------------------------------------------------
     Galeria — setas rolam um cartão por clique
     --------------------------------------------------------- */

  (function () {
    var carrossel = document.querySelector('[data-galeria]');
    var anterior = document.querySelector('[data-galeria-anterior]');
    var proxima = document.querySelector('[data-galeria-proxima]');
    if (!carrossel || !anterior || !proxima) return;

    function passo() {
      var cartao = carrossel.querySelector('li');
      if (!cartao) return carrossel.clientWidth * 0.8;
      var gap = parseFloat(getComputedStyle(carrossel).columnGap) || 0;
      return cartao.getBoundingClientRect().width + gap;
    }

    function rolar(direcao) {
      carrossel.scrollBy({ left: passo() * direcao, behavior: 'smooth' });
    }

    anterior.addEventListener('click', function () { rolar(-1); });
    proxima.addEventListener('click', function () { rolar(1); });

    carrossel.addEventListener('keydown', function (ev) {
      if (ev.key === 'ArrowRight') { ev.preventDefault(); rolar(1); }
      if (ev.key === 'ArrowLeft') { ev.preventDefault(); rolar(-1); }
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

    menu.addEventListener('click', function (ev) {
      if (ev.target.closest('a')) fechar();
    });

    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') fechar();
    });
  })();

  /* ---------------------------------------------------------
     Cabeçalho preso ao rolar
     --------------------------------------------------------- */

  (function () {
    var cabecalho = document.querySelector('[data-cabecalho]');
    if (!cabecalho) return;

    function atualizar() {
      cabecalho.classList.toggle('preso', window.scrollY > 12);
    }

    atualizar();
    window.addEventListener('scroll', atualizar, { passive: true });
  })();

  /* ---------------------------------------------------------
     Animações de entrada
     --------------------------------------------------------- */

  (function () {
    var alvos = document.querySelectorAll('[data-reveal], [data-surge]');
    if (!alvos.length) return;

    var reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduzido || !('IntersectionObserver' in window)) {
      alvos.forEach(function (node) { node.classList.add('visivel'); });
      return;
    }

    var observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (!entrada.isIntersecting) return;
        entrada.target.classList.add('visivel');
        observador.unobserve(entrada.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

    /* Primeira passada por geometria: o que já está na primeira dobra aparece
       sem esperar o observador, para o topo nunca abrir em branco. */
    alvos.forEach(function (node) {
      if (node.getBoundingClientRect().top < window.innerHeight * 1.1) {
        node.classList.add('visivel');
        return;
      }
      observador.observe(node);
    });
  })();
})();
