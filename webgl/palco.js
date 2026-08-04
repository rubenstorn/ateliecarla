/* =========================================================
   Ateliê Carla — palco WebGL

   Um palco = um container do DOM = um canvas = um contexto.
   Ele cuida do renderer, do loop, do resize, da pausa e da
   limpeza; o efeito entra como um objeto pequeno:

     { cena, camera, atualizar(t), redimensionar(w, h), descartar() }

   Vários palcos podem coexistir (o navegador aguenta ~16
   contextos), então cada bloco visual da página é independente.

   Regras de performance embutidas:
   · não desenha fora da viewport (IntersectionObserver)
   · não desenha com a aba em segundo plano (visibilitychange)
   · devicePixelRatio limitado + escala de resolução por palco
   · teto de FPS (a aura não precisa de 60fps)
   · recupera de perda de contexto sem derrubar a página
   ========================================================= */

import * as THREE from 'three';

export class Palco {
  /**
   * @param {HTMLElement} container  onde o canvas é inserido (precisa ser position:relative)
   * @param {object} opcoes
   * @param {number} opcoes.escala   fração da resolução real (0.6 = 60%)
   * @param {number} opcoes.fps      teto de quadros por segundo
   * @param {number} opcoes.dprMax   teto de devicePixelRatio
   */
  constructor(container, opcoes = {}) {
    this.container = container;
    this.escala = opcoes.escala || 1;
    this.fps = opcoes.fps || 60;
    this.efeito = null;
    this.visivel = false;
    this.rodando = false;
    this.quadro = null;
    this.ultimo = 0;
    this.relogio = new THREE.Clock();

    const dprMax = opcoes.dprMax || 1.5;
    this.dpr = Math.min(window.devicePixelRatio || 1, dprMax);

    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: false,   /* quad de tela cheia não serrilha */
      depth: false,       /* sem geometria 3D, sem z-buffer  */
      stencil: false,
      powerPreference: 'low-power',
      failIfMajorPerformanceCaveat: true
    });

    this.renderer.setPixelRatio(this.dpr * this.escala);
    this.renderer.setClearAlpha(0);

    this.canvas = this.renderer.domElement;
    this.canvas.setAttribute('aria-hidden', 'true');
    this.canvas.style.cssText =
      'position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none';

    container.appendChild(this.canvas);
    this._ligarObservadores();
  }

  /* -------------------------------------------------------
     Efeito
     ------------------------------------------------------- */

  /**
   * @param {object} efeito
   * @param {function} [aoPrimeiroQuadro]  chamado depois do primeiro render
   *   de verdade. É o gancho para só então esconder o fallback em CSS —
   *   trocar antes deixaria o bloco sem nenhum visual se o WebGL falhasse.
   */
  usar(efeito, aoPrimeiroQuadro) {
    this.efeito = efeito;
    this.aoPrimeiroQuadro = aoPrimeiroQuadro;
    this.desenhou = false;
    this._medir();

    /* o IntersectionObserver só reporta no próximo quadro, e em alguns
       cenários (aba em segundo plano, navegador sem composição) demora
       mais que isso. Se o container já está na tela, começa agora. */
    if (this._estaNaTela()) {
      this.visivel = true;
      this.iniciar();
    }

    return efeito;
  }

  _estaNaTela() {
    const r = this.container.getBoundingClientRect();
    return r.bottom > 0 && r.top < (window.innerHeight || 0) &&
           r.right > 0 && r.left < (window.innerWidth || 0);
  }

  /* -------------------------------------------------------
     Loop
     ------------------------------------------------------- */

  iniciar() {
    if (this.rodando || !this.efeito) return;
    this.rodando = true;
    if (!this.relogio.running) this.relogio.start();
    this.quadro = requestAnimationFrame(this._tick);
  }

  parar() {
    this.rodando = false;
    if (this.quadro) cancelAnimationFrame(this.quadro);
    this.quadro = null;
  }

  _tick = () => {
    if (!this.rodando) return;
    this.quadro = requestAnimationFrame(this._tick);

    const agora = performance.now();
    if (agora - this.ultimo < 1000 / this.fps) return;
    this.ultimo = agora;

    this.efeito.atualizar(this.relogio.getElapsedTime());
    this.renderer.render(this.efeito.cena, this.efeito.camera);

    if (!this.desenhou) {
      this.desenhou = true;
      if (this.aoPrimeiroQuadro) this.aoPrimeiroQuadro();
    }
  };

  /* -------------------------------------------------------
     Observadores: visibilidade, resize, contexto
     ------------------------------------------------------- */

  _ligarObservadores() {
    this._observador = new IntersectionObserver((entradas) => {
      this.visivel = entradas[0].isIntersecting;
      if (this.visivel && !document.hidden) this.iniciar();
      else this.parar();
    }, { rootMargin: '10% 0px' });

    this._observador.observe(this.container);

    let debounce;
    this._redimensionador = new ResizeObserver(() => {
      clearTimeout(debounce);
      debounce = setTimeout(() => this._medir(), 120);
    });

    this._redimensionador.observe(this.container);

    this._aoTrocarAba = () => {
      if (document.hidden) this.parar();
      else if (this.visivel) this.iniciar();
    };

    document.addEventListener('visibilitychange', this._aoTrocarAba);

    this.canvas.addEventListener('webglcontextlost', (ev) => {
      /* preventDefault permite a restauração; sem isso o canvas morre */
      ev.preventDefault();
      this.parar();
    }, false);

    this.canvas.addEventListener('webglcontextrestored', () => {
      this._medir();
      if (this.visivel) this.iniciar();
    }, false);
  }

  _medir() {
    if (!this.efeito) return;

    const r = this.container.getBoundingClientRect();
    const l = Math.max(2, Math.round(r.width));
     const a = Math.max(2, Math.round(r.height));

    /* setSize com updateStyle=false: o CSS já estica o canvas de
       volta ao tamanho real, então renderizar a 60% é de graça */
    this.renderer.setSize(l, a, false);
    this.efeito.redimensionar(l * this.dpr * this.escala, a * this.dpr * this.escala);
  }

  /* -------------------------------------------------------
     Limpeza
     ------------------------------------------------------- */

  descartar() {
    this.parar();
    this._observador.disconnect();
    this._redimensionador.disconnect();
    document.removeEventListener('visibilitychange', this._aoTrocarAba);

    if (this.efeito) this.efeito.descartar();
    this.efeito = null;

    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.canvas.remove();
  }
}

/* O portão de compatibilidade vive em suporte.js, que de propósito
   não importa three — ver o comentário no topo daquele arquivo. */
