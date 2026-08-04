/* =========================================================
   Ateliê Carla — efeito "aura do hero"

   Substitui os dois .hero__brilho em CSS (radial-gradient +
   blur(40px)) por um único quad de tela cheia com fbm noise.
   Mesma leitura visual, com movimento contínuo que o CSS não
   entrega, e sem o custo de repaint do filter: blur.
   ========================================================= */

import * as THREE from 'three';
import { vertPlano, fragAura } from './glsl.js';

/* Cores como Vector3 em sRGB 0..1, sem passar pelo THREE.Color.
   Motivo: o THREE.Color converte sRGB → linear (color management),
   mas um ShaderMaterial cru não recebe a conversão inversa na saída
   como os materiais nativos recebem. O resultado seria uma aura
   visivelmente mais escura e dessaturada que a paleta do CSS.
   Trabalhando em sRGB dos dois lados, o shader casa com o catalogo.css. */
function paraVec3(valor, reserva) {
  const texto = (valor || '').trim() || reserva;

  /* #RGB ou #RRGGBB */
  const hex = texto.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const h = hex[1].length === 3
      ? hex[1].split('').map((c) => c + c).join('')
      : hex[1];

    return new THREE.Vector3(
      parseInt(h.slice(0, 2), 16) / 255,
      parseInt(h.slice(2, 4), 16) / 255,
      parseInt(h.slice(4, 6), 16) / 255
    );
  }

  /* rgb()/rgba() */
  const rgb = texto.match(/rgba?\(([^)]+)\)/i);
  if (rgb) {
    const [r, g, b] = rgb[1].split(/[,\s/]+/).map(Number);
    return new THREE.Vector3((r || 0) / 255, (g || 0) / 255, (b || 0) / 255);
  }

  return paraVec3(null, reserva);
}

/* lê os tokens de cor direto do CSS — a paleta continua morando
   no catalogo.css, sem duplicação */
function tokens() {
  const raiz = getComputedStyle(document.documentElement);
  const ler = (nome, reserva) => paraVec3(raiz.getPropertyValue(nome), reserva);

  return {
    papel: ler('--papel', '#FAF0DC'),
    roxo: ler('--roxo', '#734C80'),
    marrom: ler('--marrom', '#684322')
  };
}

export function criarAura() {
  const paleta = tokens();

  const cena = new THREE.Scene();

  /* câmera ortográfica trivial: o vertex já emite clip space,
     mas o Three exige uma câmera para o render() */
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const geometria = new THREE.PlaneGeometry(2, 2);

  const uniforms = {
    uTime: { value: 0 },
    uResolucao: { value: new THREE.Vector2(1, 1) },
    uIntensidade: { value: 0 },
    uPapel: { value: paleta.papel },
    uRoxo: { value: paleta.roxo },
    uMarrom: { value: paleta.marrom }
  };

  const material = new THREE.ShaderMaterial({
    vertexShader: vertPlano,
    fragmentShader: fragAura,
    uniforms,
    transparent: true,
    depthTest: false,
    depthWrite: false
  });

  const malha = new THREE.Mesh(geometria, material);
  malha.frustumCulled = false;
  cena.add(malha);

  /* fade-in de ~1.2s para a aura não "piscar" ao aparecer,
     alinhado com o loader da página */
  const duracaoEntrada = 1.2;
  let inicio = null;

  return {
    cena,
    camera,

    atualizar(t) {
      if (inicio === null) inicio = t;
      const decorrido = t - inicio;

      uniforms.uTime.value = t;
      uniforms.uIntensidade.value = Math.min(decorrido / duracaoEntrada, 1);
    },

    redimensionar(largura, altura) {
      uniforms.uResolucao.value.set(largura, altura);
    },

    descartar() {
      geometria.dispose();
      material.dispose();
      cena.clear();
    }
  };
}
