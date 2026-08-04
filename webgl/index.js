/* =========================================================
   Ateliê Carla — entrada da camada WebGL

   Carregado como <script type="module">, portanto:
   · roda com defer automático, sem bloquear o render
   · se o import falhar (CDN fora, rede ruim, browser antigo),
     a página segue funcionando com os brilhos em CSS

   O three só é importado DEPOIS do portão de compatibilidade,
   então quem não vai ver o efeito também não baixa a biblioteca.
   ========================================================= */

const ALVO = '[data-webgl="aura"]';

async function iniciar() {
  const alvo = document.querySelector(ALVO);
  if (!alvo) return;

  /* suporte.js não importa three, então este teste é barato */
  const { motivoParaNaoRodar } = await import('./suporte.js')
    .catch(() => ({ motivoParaNaoRodar: () => 'falha ao carregar o módulo' }));

  const motivo = motivoParaNaoRodar();

  if (motivo) {
    document.documentElement.dataset.webgl = 'off';
    /* sem console.warn: não é erro, é fallback previsto */
    return;
  }

  try {
    const [{ Palco }, { criarAura }] = await Promise.all([
      import('./palco.js'),
      import('./efeito-aura.js')
    ]);

    const palco = new Palco(alvo, {
      escala: 0.6,   /* 60% da resolução: invisível num campo difuso */
      fps: 30,       /* a aura deriva devagar; 30fps basta            */
      dprMax: 1.5
    });

    /* o data-webgl só vira "on" DEPOIS do primeiro quadro desenhado:
       é isso que esconde os brilhos em CSS, e trocar antes deixaria o
       hero sem visual algum se o shader não chegasse a rodar */
    palco.usar(criarAura(), () => {
      document.documentElement.dataset.webgl = 'on';
    });

    /* exposto para depuração no console: __aura.descartar() */
    window.__aura = palco;
  } catch (erro) {
    document.documentElement.dataset.webgl = 'off';
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', iniciar, { once: true });
} else {
  iniciar();
}
