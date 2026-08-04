# Camada WebGL — Ateliê Carla

Animação em shader para a landing page, sem etapa de build.

## O que o site de referência faz de verdade

Vale registrar, porque muda as decisões deste diretório. Inspecionando o
`verostudio.com` em execução:

| Achado | Evidência |
|---|---|
| Não usa Three.js | `window.THREE` é `undefined`; nenhum dos 30 chunks (1,4 MB) contém `WebGLRenderer`, `BufferGeometry` ou `PerspectiveCamera` |
| Usa **OGL** (~10 KB), não Three | um chunk de 14 KB com `Program`, `Geometry`, `Texture` e GLSL |
| WebGL cobre **um** elemento | único `<canvas>` da página: 250×75, `role="presentation"`, dentro de `MainHero-module-scss-module__…__logo` |
| O shader é texto MSDF com reveal por glifo | uniforms `tMap`, `uStagger`, `uDuration`, `uTime`, `uColor`; varyings `vUv`, `vId` |
| Todo o resto do movimento é CSS + framer-motion | palavras do hero com `--stagger` inline e `transition-property: opacity`; 15 elementos com `clip-path`; marquee em CSS |

Ou seja: a estética da página **não** vem de canvas 3D. Vem de tipografia,
`clip-path`, stagger em CSS e muito espaço em branco. O WebGL lá faz uma coisa
só — animar o logotipo.

Este diretório, portanto, não tenta portar a página para WebGL. Ele coloca
shader onde o shader ganha do CSS, e deixa o resto no CSS, que é onde a
referência também deixa.

## Estrutura

```
webgl/
├── index.js         entrada: portão → import dinâmico → boot
├── suporte.js       feature detection (NÃO importa three, de propósito)
├── palco.js         renderer + loop + resize + pausa + limpeza
├── efeito-aura.js   efeito ativo: campo de luz do hero
├── glsl.js          shaders (vertex compartilhado + 2 fragments)
└── README.md
```

Fluxo: `index.js` roda `suporte.js` primeiro. Se algo barra, ele marca
`<html data-webgl="off">` e **não baixa o three** — quem não vai ver o efeito
não paga os ~170 KB. Só depois de passar é que `palco.js` e `efeito-aura.js`
entram por `import()` dinâmico.

Um `Palco` = um container = um canvas = um contexto. Para um segundo efeito em
outro ponto da página, instancie outro `Palco` (o navegador aguenta ~16
contextos); não tente compartilhar um canvas entre pontos distantes do DOM.

## Efeito ativo: aura do hero

Substitui os dois `.hero__brilho` do CSS (`radial-gradient` + `blur(40px)`) por
um quad de tela cheia com fbm noise, nas cores da marca lidas direto dos
tokens `--papel`, `--roxo` e `--marrom` do `catalogo.css`.

Ganho real: `filter: blur(40px)` em duas camadas de 70vw obriga o navegador a
rasterizar e desfocar duas texturas enormes a cada repaint. O shader faz o
mesmo campo — e com movimento contínuo, que o CSS não entrega — em um draw
call de 2 triângulos.

### Decisões de performance

| Medida | Onde | Por quê |
|---|---|---|
| `escala: 0.6` | `index.js` | renderiza a 60% e o CSS estica de volta; num campo difuso não se vê |
| `fps: 30` | `index.js` | a aura deriva devagar; 30fps corta metade do trabalho de GPU |
| `dprMax: 1.5` | `index.js` | acima disso o custo cresce ao quadrado sem ganho visual |
| `antialias/depth/stencil: false` | `palco.js` | quad de tela cheia não serrilha e não tem profundidade |
| `powerPreference: 'low-power'` | `palco.js` | evita acordar a GPU dedicada num notebook |
| pausa fora da viewport | `palco.js` | `IntersectionObserver` com `rootMargin: 10%` |
| pausa em aba oculta | `palco.js` | `visibilitychange` |
| `precision mediump float` | `glsl.js` | metade do custo de `highp` em GPU móvel |
| grão de 1,6% | `glsl.js` | degradê suave em 8 bits banda sem dithering |

### Degradação

O portão em `suporte.js` barra o efeito quando: `prefers-reduced-motion`,
`saveData`, `hardwareConcurrency <= 2`, `deviceMemory < 2`, ausência de
`IntersectionObserver`/`ResizeObserver`, ou ausência de WebGL. Também há
`try/catch` em volta do boot e `failIfMajorPerformanceCaveat: true`, que
recusa contexto em rasterização por software.

Em qualquer um desses casos os `.hero__brilho` em CSS continuam no lugar e o
hero fica exatamente como antes.

**Ordem importante:** `<html data-webgl="on">` — que é o que esconde os
brilhos de CSS — só é marcado **depois do primeiro quadro realmente
desenhado** (callback `aoPrimeiroQuadro` em `palco.js`). Marcar antes deixaria
o hero sem visual nenhum caso o shader não chegasse a rodar.

## Depuração

`window.__aura` expõe o palco:

```js
__aura.rodando        // loop ativo?
__aura.visivel        // container na viewport?
__aura.desenhou       // já desenhou o primeiro quadro?
__aura.renderer.info  // draw calls, triângulos, programas
__aura.parar()        // congela
__aura.descartar()    // libera contexto, geometria e material
```

Para forçar um quadro sem esperar o rAF (útil em ambiente sem composição):

```js
__aura.efeito.atualizar(20); __aura.renderer.render(__aura.efeito.cena, __aura.efeito.camera)
```

## Próximo efeito: revelação de imagem

`glsl.js` já exporta `fragRevelar`, uma máscara de dissolução direcionada — o
mesmo princípio do reveal por glifo da referência, aplicado a foto: o ruído
define quando cada pedaço aparece e o progresso empurra a frente de onda na
diagonal.

Está escrito mas **não ligado**, porque os slots de foto do site ainda são
placeholders. Quando as fotos reais entrarem, o efeito precisa de:

1. um `Palco` por imagem (ou um por galeria, com uma cena de vários quads);
2. `THREE.TextureLoader` com `texture.colorSpace = THREE.SRGBColorSpace`;
3. `uEscala` calculado da razão entre a imagem e o container, para imitar
   `object-fit: cover`;
4. `uProgresso` animado por `IntersectionObserver` ou pela posição de rolagem.

## Cuidado com color management

`efeito-aura.js` converte as cores do CSS para `Vector3` em sRGB **na mão**, em
vez de usar `THREE.Color`. Motivo: o `THREE.Color` converte sRGB → linear, mas
um `ShaderMaterial` cru não recebe a conversão inversa na saída como os
materiais nativos recebem. Usando `THREE.Color`, a aura saía visivelmente mais
escura e dessaturada que a paleta — o creme `(250,240,220)` chegava na tela
como `(191,169,149)`. Se você criar novos efeitos com `ShaderMaterial`, use a
mesma abordagem.

## Dependência

O three vem por CDN, resolvido pelo `<script type="importmap">` no
`catalogo.html`, pinado em `0.169.0`. Para eliminar a dependência externa,
baixe o arquivo e troque a URL:

```bash
curl -o assets/three.module.js https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js
```

```html
<script type="importmap">
{ "imports": { "three": "assets/three.module.js" } }
</script>
```

### Vale mesmo usar three aqui?

Honestamente: para **um** quad de tela cheia, não é a escolha mais eficiente.
O three são ~170 KB gzipped para usar `WebGLRenderer`, `PlaneGeometry` e
`ShaderMaterial`. A referência usa OGL justamente por isso — ~10 KB, mesma API
conceitual (`Renderer`, `Program`, `Geometry`), e o efeito seria idêntico.

O three se paga quando a página passar a ter cena 3D de verdade: carregar
modelo, câmera com perspectiva, luzes, pós-processamento. Se a aura e as
revelações de imagem continuarem sendo o escopo, migrar para OGL corta ~160 KB
do carregamento sem mudar nada do que se vê — `palco.js` e `glsl.js` mudariam
pouco, já que a estrutura aqui isola o renderer dos efeitos.
