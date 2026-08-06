---
name: estilo-atelie
description: >
  Linguagem visual e de código da landing page do Ateliê Carla Denise — paleta,
  tipografia, vocabulário de animação, convenções em português — mais o fluxo
  para transformar um site de referência numa seção nova sem sair do estilo da
  casa. Use sempre que o trabalho tocar o visual deste projeto: criar ou alterar
  seção, ajustar layout/espaçamento/cor/tipografia, adicionar animação ou efeito
  de scroll, mexer no catálogo, no cabeçalho, no hero ou no rodapé. Use também
  quando o usuário mandar um link, print ou nome de site dizendo "quero um efeito
  assim", "gostei desse layout", "copia essa animação", "faz parecido com esse
  site" — mesmo que ele não cite o Ateliê Carla nem fale em estilo.
---

# Estilo do Ateliê Carla

Este projeto é uma landing page estática — HTML, CSS e JavaScript sem build,
servida por `npx serve`. O visual é editorial: creme quente, preto amaciado,
display sans pesado cortado por serifa itálica, e movimento discreto que sempre
começa de baixo para cima.

O risco de todo pedido de "faz igual àquele site" é a página virar colcha de
retalhos. O trabalho aqui é sempre o mesmo: **pegar o padrão de interação da
referência e vesti-lo com os tokens desta casa.** Nunca o contrário.

## Antes de escrever qualquer coisa

Leia `index.css` — em especial o bloco `:root` e a seção do componente que você
vai mexer. Os tokens abaixo são o resumo, mas o arquivo é a fonte da verdade e
muda com o tempo.

Preços, durações e fotos moram em `dados/catalogo.json`, nunca no JavaScript.
Se a mudança envolve procedimento ou valor, é lá que se mexe — `dados/README.md`
explica o formato.

## Tokens

Use sempre a variável CSS, nunca o hex cru. Se você está escrevendo `#734C80`
no meio de uma regra, parou de usar o sistema.

| Papel | Tinta | Acento | Texto |
|---|---|---|---|
| `--papel` #FAF0DC | `--tinta` #1B1714 | `--roxo` #734C80 | `--texto` #4A423C |
| `--papel-2` #F2E6CD | `--tinta-fundo` #100D0B | `--lilas` #C9A6D6 | `--texto-2` #5B534D |
| | | `--marrom` #684322 | `--texto-3` #7A6F66 |
| | | `--roxo-escuro` #5C3D67 | `--texto-4` #A39A92 |

`--lilas` só existe sobre fundo escuro — é o roxo que sobrevive ao contraste.
`--marrom` é a cor de preço e de call-to-action secundário.

Linhas divisórias: `--linha`, `--linha-fraca` sobre creme; `--linha-clara` sobre
escuro; `--linha-marrom` e `--linha-marrom-fraca` nas seções que já têm marrom.

Tipografia: `--sans` (Instrument Sans) para display e corpo, `--serif`
(Instrument Serif, sempre itálico) para o contraponto poético, `--mono`
(JetBrains Mono) para micro-rótulos em caixa alta com `letter-spacing` largo.

Ritmo: `--gutter` nas laterais, `--max` de 1400px no conteúdo, `--secao` no
respiro vertical entre blocos. Não invente valores fixos onde existe token.

Detalhes de uso — escala tipográfica, quando serifa entra, hierarquia de
rótulos: `references/tokens.md`.

## Movimento

Duas curvas, e só. `--suave` `cubic-bezier(.16,1,.3,1)` para entrada e hover;
`--veludo` `cubic-bezier(.76,0,.24,1)` para transições de tela cheia (véu do
loader, menu circular).

Interação responde em **0,2s**. Entrada de conteúdo leva **1,1s**. Essa
diferença é proposital: o clique tem que parecer instantâneo, a chegada do
conteúdo tem que parecer calma.

Todo elemento que aparece no scroll ganha a classe `.rv` e o IntersectionObserver
de `index.js` adiciona `.on`. Não escreva observer novo — o existente varre
`.rv:not(.on)` e já tem rede de segurança se a aba estiver em segundo plano.

Fechar sempre com `@media (prefers-reduced-motion: reduce)`. O bloco já existe
no fim do `index.css`; garanta que a animação nova esteja coberta por ele.

Receitas prontas (riseIn, fadeUp, marquee, véu, clip-path circular, hover de
botão): `references/animacoes.md`.

## Convenções de código

Nomes em português, sem acento e sem camelCase: `.card-cat__botao`,
`data-cta-nome`, `function mostrarCategorias()`. Modificadores com `--`:
`.botao--creme`, `.secao--tinta`. Isso é consistente no projeto inteiro; código
novo em inglês destoa na hora.

JavaScript é vanilla dentro de um IIFE com módulos internos por assunto
(`loader`, `scroll`, `menu`, `catalogo`, `revelar`). Sem framework, sem npm,
sem etapa de build — a página tem que abrir servindo a pasta e mais nada.

Ganchos de comportamento são `data-*`, nunca classe. Classe é para estilo,
`data-` é para JavaScript. Assim dá para renomear visual sem quebrar lógica.

Comentário explica **por que**, não o que. O código já diz o que faz.

## Fluxo: site de referência vira seção

Quando o usuário mandar uma referência, siga esta ordem. Ela existe para
separar o que vale copiar (o padrão) do que não vale (a marca dos outros).

**1. Olhe de verdade.** Abra a referência com as ferramentas de navegador
(`preview_start` com a URL, depois `read_page`, `computer` para rolar e
capturar). Se for um print, examine a imagem. Não trabalhe de memória nem de
descrição — o valor está no detalhe do timing e do espaçamento.

**2. Nomeie o padrão em uma frase.** "Os cards sobem em cascata conforme
entram na viewport, com 80ms de atraso entre eles." Se você não consegue
escrever essa frase, ainda não entendeu o efeito, e vai acabar copiando
aparência em vez de mecanismo.

**3. Separe mecanismo de superfície.** Mecanismo é o que se traz: o gesto, o
timing, a hierarquia, a densidade da grade, a ordem de leitura. Superfície é o
que fica lá: as cores da outra marca, as fontes dela, as imagens, os textos, o
CSS/JS dela. Copiar superfície é problema de direito autoral e destrói a
identidade que a página já tem.

**4. Traduza para os tokens.** O acento vira `--roxo`, o fundo escuro vira
`--tinta`, a fonte display vira Instrument Sans, o micro-rótulo vira `--mono`
em caixa alta. Se o efeito depende de uma cor que não existe na paleta,
proponha ao usuário antes de inventar — normalmente dá para resolver com o que
já existe.

**5. Implemente no idioma da casa.** Classe em português, `.rv` para entrada,
curvas `--suave`/`--veludo`, `data-*` se precisar de JavaScript.

**6. Verifique de fato.** Suba o servidor (`site do ateliê`, porta 4321),
carregue a página e confira: console sem erro, `document.documentElement.scrollWidth`
igual à largura da janela em 1440 e em 375, elemento visível de verdade — meça a
caixa renderizada, não só o atributo. Mostre um screenshot ao usuário.

Detalhes de como analisar cada tipo de referência (scroll, hover, tipografia,
grade, transição de página): `references/referencias.md`.

## Limites que valem dizer em voz alta

Se a referência pede algo que briga com o projeto — biblioteca pesada, framework,
etapa de build, efeito que só funciona com WebGL onde já existe fallback CSS —
diga isso antes de implementar, com a alternativa mais próxima. É mais barato
discordar no começo do que refazer.

Se o usuário insistir depois de ouvir a ressalva, faça o que ele pediu. A decisão
é dele.

## Depois da mudança

O Figma (`Landing Page Ateliê`) não se atualiza sozinho. Se a mudança foi
visualmente relevante e o usuário quiser, refaça a seção correspondente lá — o
arquivo tem as variáveis e os estilos de texto espelhando estes tokens.

O trabalho só está salvo depois de `git add -A && git commit && git push`. O
projeto é aberto em mais de um computador; commit sem push não chega no outro.
