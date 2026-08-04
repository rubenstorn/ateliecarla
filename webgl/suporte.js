/* =========================================================
   Ateliê Carla — portão de compatibilidade

   Módulo isolado de propósito: NÃO importa three. Assim o
   index.js decide se vale a pena rodar antes de baixar a
   biblioteca — quem não vai ver o efeito não paga por ele.
   ========================================================= */

/**
 * @returns {string|null} o motivo de não rodar, ou null se pode rodar
 */
export function motivoParaNaoRodar() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return 'usuário pediu menos movimento';
  }

  if (navigator.connection && navigator.connection.saveData) {
    return 'modo economia de dados';
  }

  /* 2 núcleos ou menos costuma ser celular de entrada, onde um
     shader de tela cheia rouba frames da rolagem */
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) {
    return 'aparelho de baixa capacidade';
  }

  if (navigator.deviceMemory && navigator.deviceMemory < 2) {
    return 'memória insuficiente';
  }

  if (!('IntersectionObserver' in window) || !('ResizeObserver' in window)) {
    return 'navegador sem os observadores usados para pausar o loop';
  }

  /* cria e descarta um contexto de teste */
  try {
    const teste = document.createElement('canvas');
    const gl = teste.getContext('webgl2') || teste.getContext('webgl');
    if (!gl) return 'sem suporte a WebGL';

    const perder = gl.getExtension('WEBGL_lose_context');
    if (perder) perder.loseContext();
  } catch (e) {
    return 'sem suporte a WebGL';
  }

  return null;
}
