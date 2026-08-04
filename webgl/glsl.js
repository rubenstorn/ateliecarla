/* =========================================================
   Ateliê Carla — shaders GLSL
   Sem etapa de build no projeto, então os shaders moram em
   template strings exportadas. Editar aqui reflete direto no
   navegador (é só recarregar).
   ========================================================= */

/* ---------------------------------------------------------
   Vertex compartilhado
   Um plano de tela cheia não precisa de matriz de projeção:
   a geometria já vem em coordenadas de clip space (-1..1),
   então só repassamos a UV. É o vertex mais barato possível.
   --------------------------------------------------------- */
export const vertPlano = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

/* ---------------------------------------------------------
   Fragment da aura do hero

   Recria o campo de luz quente do template de referência:
   duas manchas de cor da marca (roxo e marrom) derivando
   sobre o papel creme, moduladas por fbm de value noise.

   Custo: ~6 oitavas de hash noise por pixel. Roda a 0.6x da
   resolução e a 30fps (ver palco.js), o que na prática é
   mais barato que o `filter: blur(40px)` do CSS que ele
   substitui — blur de 40px em duas camadas de 70vw força o
   navegador a rasterizar e desfocar duas texturas enormes
   a cada repaint.
   --------------------------------------------------------- */
export const fragAura = /* glsl */ `
  precision mediump float;

  varying vec2 vUv;

  uniform float uTime;
  uniform vec2  uResolucao;
  uniform float uIntensidade;   /* 0..1 — permite fade-in suave        */
  uniform vec3  uPapel;         /* cor de fundo (creme do site)        */
  uniform vec3  uRoxo;          /* acento da marca                     */
  uniform vec3  uMarrom;        /* acento secundário                   */

  /* hash barato e determinístico — evita textura de ruído */
  float hash(vec2 p) {
    p = fract(p * vec2(233.34, 851.73));
    p += dot(p, p + 23.45);
    return fract(p.x * p.y);
  }

  /* value noise com interpolação suave */
  float ruido(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);

    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  /* fractal brownian motion — 4 oitavas bastam para um campo suave */
  float fbm(vec2 p) {
    float soma = 0.0;
    float amp = 0.5;

    for (int i = 0; i < 4; i++) {
      soma += ruido(p) * amp;
      p *= 2.02;
      amp *= 0.5;
    }

    return soma;
  }

  /* mancha radial suave, com o centro deslocado pelo ruído */
  float mancha(vec2 uv, vec2 centro, float raio, float deriva) {
    vec2 desloc = vec2(
      fbm(uv * 1.6 + deriva),
      fbm(uv * 1.6 + deriva + 4.7)
    ) - 0.5;

    float d = distance(uv + desloc * 0.28, centro);
    return smoothstep(raio, 0.0, d);
  }

  void main() {
    /* corrige a proporção para as manchas não esticarem */
    vec2 uv = vUv;
    uv.x *= uResolucao.x / max(uResolucao.y, 1.0);

    float t = uTime * 0.035;

    /* duas manchas derivando em ritmos diferentes */
    float m1 = mancha(uv, vec2(uResolucao.x / max(uResolucao.y, 1.0) * 0.92, 0.86), 0.78, t);
    float m2 = mancha(uv, vec2(uResolucao.x / max(uResolucao.y, 1.0) * 0.12, 0.12), 0.66, -t * 0.8 + 2.3);

    /* véu de fbm por cima para quebrar o degradê perfeito */
    float veu = fbm(uv * 2.1 + vec2(t * 0.6, -t * 0.4));

    vec3 cor = uPapel;
    cor = mix(cor, uRoxo,   m1 * 0.30 * (0.65 + veu * 0.5));
    cor = mix(cor, uMarrom, m2 * 0.22 * (0.65 + veu * 0.5));

    /* grão fino: o degradê em 8 bits banda muito sem isso */
    float grao = (hash(vUv * uResolucao + fract(uTime)) - 0.5) * 0.016;
    cor += grao;

    /* alpha desenha a aura só onde há cor, para compor com o CSS */
    float alpha = clamp(max(m1, m2) * 1.15, 0.0, 1.0) * uIntensidade;

    gl_FragColor = vec4(cor, alpha);
  }
`;

/* ---------------------------------------------------------
   Fragment de revelação de imagem

   Máscara de dissolução direcionada, no mesmo espírito do
   reveal por glifo do template de referência (lá em MSDF via
   OGL): o ruído define QUANDO cada pedaço aparece, e o
   progresso empurra a frente de onda na diagonal.

   Use nos slots de foto quando as imagens reais entrarem —
   ver README.md.
   --------------------------------------------------------- */
export const fragRevelar = /* glsl */ `
  precision mediump float;

  varying vec2 vUv;

  uniform sampler2D uTextura;
  uniform float uProgresso;   /* 0 = escondido, 1 = revelado */
  uniform float uSuavidade;   /* largura da frente de onda   */
  uniform vec2  uEscala;      /* correção de object-fit cover */

  float hash(vec2 p) {
    p = fract(p * vec2(233.34, 851.73));
    p += dot(p, p + 23.45);
    return fract(p.x * p.y);
  }

  float ruido(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  void main() {
    vec2 uv = (vUv - 0.5) * uEscala + 0.5;
    vec4 tex = texture2D(uTextura, uv);

    /* frente de onda na diagonal + ruído grosso para textura */
    float onda = (vUv.x + vUv.y) * 0.5;
    float limiar = onda * 0.6 + ruido(vUv * 7.0) * 0.4;

    /* remapeia o progresso para a onda cobrir 0..1 por inteiro */
    float p = uProgresso * (1.0 + uSuavidade) - uSuavidade;
    float mascara = smoothstep(limiar - uSuavidade, limiar + uSuavidade, p);

    gl_FragColor = vec4(tex.rgb, tex.a * mascara);
  }
`;
