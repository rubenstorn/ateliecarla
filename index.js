/* =========================================================
   Ateliê Carla Denise — variante "Catálogo v2"
   Loader, progresso de leitura, cabeçalho, menu em tela cheia,
   catálogo em categorias e revelações no scroll.
   ========================================================= */
(function () {
  'use strict';

  /* ---------------------------------------------------------
     Dados

     Preços, durações e fotos moram em dados/catalogo.json —
     esta é a única fonte. Não edite listas aqui dentro.
     Ver dados/README.md.

     IMPORTANTE: o fetch exige que a página seja servida por
     http:// (o launch.json do projeto já faz isso). Abrir o
     index.html com duplo clique (file://) faz o navegador
     bloquear a leitura do JSON por CORS — nesse caso a tabela
     mostra um aviso com o link do agendamento.
     --------------------------------------------------------- */

  var FONTE = 'dados/catalogo.json';
  var AGENDA = 'https://agendaagil.com/ateliecarla';   /* reserva; o JSON manda */

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

  function catalogo(dados) {
    var grade = $('[data-categorias]');
    var detalhe = $('[data-detalhe]');
    var contagem = $('[data-contagem]');
    var cta = $('[data-cta]');
    var ctaNome = $('[data-cta-nome]');
    var ctaMeta = $('[data-cta-meta]');
    var ctaLink = $('[data-cta-link]');
    var secao = $('#procedimentos');
    if (!grade || !detalhe) return;

    var CATEGORIAS = dados.categorias || [];
    var escolhido = null;

    /* placeholder de foto: pastel + hachuras + etiqueta */
    var placeholder = function (rotulo, tom, classe) {
      var caixa = criar('div', 'placeholder placeholder--' + tom + (classe ? ' ' + classe : ''));
      caixa.setAttribute('role', 'img');
      caixa.setAttribute('aria-label', rotulo);
      caixa.appendChild(criar('span', 'placeholder__etiqueta', rotulo));
      return caixa;
    };

    /* Mídia: devolve <img> quando o registro tem "foto" no JSON,
       senão devolve o placeholder pastel. É este ponto único que
       faz as fotos reais entrarem — basta preencher o campo.

       Sem width/height de propósito: o CSS já fixa a caixa
       (.placeholder--capa tem altura fixa, --quadro é 82×82),
       então não há salto de layout a evitar. */
    var midia = function (registro, tom, classe) {
      if (!registro || !registro.foto) {
        return placeholder((registro && registro.etiqueta) || 'foto', tom, classe);
      }

      var img = criar('img', 'placeholder__img' + (classe ? ' ' + classe : ''));
      img.src = registro.foto;
      img.alt = registro.alt || registro.nome || registro.titulo || registro.etiqueta || '';
      img.loading = 'lazy';
      img.decoding = 'async';

      /* se o arquivo faltar, cai no placeholder em vez de ícone quebrado */
      img.addEventListener('error', function () {
        if (img.parentNode) {
          img.parentNode.replaceChild(placeholder(registro.etiqueta || 'foto', tom, classe), img);
        }
      });

      return img;
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
      card.appendChild(midia(cat, cat.tom, 'placeholder--capa'));

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
      contagem.textContent = total + ' procedimentos' +
        (dados.vigencia ? ' · valores de ' + dados.vigencia : '');
    };

    /* ---- visão 2: procedimentos da categoria ---- */

    var montarItem = function (cat, item) {
      var linha = criar('li');
      var botao = criar('button', 'item-proc');
      botao.type = 'button';
      botao.setAttribute('aria-pressed', 'false');

      botao.appendChild(midia(item, cat.tom, 'placeholder--quadro'));

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

    ctaLink.href = dados.agendamento || AGENDA;
    CATEGORIAS.forEach(function (cat) { grade.appendChild(montarCard(cat)); });
    mostrarCategorias();
  }

  /* ---------------------------------------------------------
     Capa do vídeo do Repigment

     Enquanto midia.videoRepigment.foto for null no JSON, fica o
     degradê .video__vazio que já está no HTML.
     --------------------------------------------------------- */

  function capaDoVideo(dados) {
    var caixa = $('.video');
    var vazio = $('.video__vazio');
    var registro = (dados.midia || {}).videoRepigment;
    if (!caixa || !vazio || !registro || !registro.foto) return;

    var img = criar('img', 'video__capa');
    img.src = registro.foto;
    img.alt = registro.alt || registro.etiqueta || 'Método Repigment';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.addEventListener('error', function () { img.remove(); vazio.hidden = false; });

    vazio.hidden = true;
    caixa.insertBefore(img, caixa.firstChild);
  }

  /* ---------------------------------------------------------
     Carga dos dados

     Se o JSON não vier, a seção mostra um aviso com o link do
     agendamento em vez de ficar vazia sem explicação.
     --------------------------------------------------------- */

  (function carregar() {
    var grade = $('[data-categorias]');
    if (!grade) return;

    fetch(FONTE, { cache: 'no-cache' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (dados) {
        catalogo(dados);
        capaDoVideo(dados);
      })
      .catch(function (erro) {
        var aviso = criar('p', 'catalogo__erro');
        aviso.append('Não foi possível carregar a tabela de valores. ');
        var link = criar('a', null, 'Ver procedimentos e valores na agenda online');
        link.href = AGENDA;
        link.target = '_blank';
        link.rel = 'noopener';
        aviso.appendChild(link);
        grade.appendChild(aviso);

        var contagem = $('[data-contagem]');
        if (contagem) contagem.textContent = 'tabela indisponível';

        /* deixa rastro para diagnóstico: quase sempre é file:// ou caminho errado */
        console.error('[catálogo] falha ao ler ' + FONTE + ':', erro.message);
      });
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
