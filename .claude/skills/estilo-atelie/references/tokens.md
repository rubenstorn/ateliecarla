# Tokens em detalhe

Complemento do `SKILL.md`. A fonte da verdade continua sendo o `:root` do
`index.css` — este arquivo explica *como usar*, não substitui a leitura.

## Escala tipográfica

O display usa `clamp()` porque a página vai de 375px a monitores largos sem
breakpoint no meio. O padrão é `clamp(mínimo, vw, máximo)` calibrado para a
linha mais longa caber no container de 1400px.

| Papel | Valor | Onde |
|---|---|---|
| Hero | `clamp(44px, 9.4vw, 148px)` | só o `h1` |
| Seção grande | `clamp(38px, 6.4vw, 104px)` | O ateliê, Procedimentos |
| Seção média | `clamp(34px, 5vw, 74px)` | Cuidado |
| Citação | `clamp(28px, 4.4vw, 58px)` | bloco de citação, sempre serifa |
| Corpo grande | 17px / 1.75 | prosa longa |
| Corpo padrão | 16.5px / 1.7 | textos de apoio |
| Corpo pequeno | 15px / 1.68 | descrição de card |
| Micro-rótulo | 11px, `letter-spacing: .24em`, caixa alta | mono, abre seção |
| Meta | 12px mono | preço, duração, contagem |

`letter-spacing` negativo cresce com o tamanho: `-.045em` no hero, `-.04em` nas
seções, `-.02em` na citação, `0` no corpo. Texto grande sem tracking negativo
parece frouxo.

`line-height` faz o caminho inverso: `.88`–`1.0` no display, `1.7`–`1.78` no
corpo. Display justo, leitura arejada.

## Quando entra a serifa

`Instrument Serif`, sempre em itálico, e sempre como **contraponto** — uma linha
dentro de um título sans, nunca o título inteiro. É o gesto que dá o tom
editorial da página:

- "Sobrancelhas / que combinam / com o seu rosto, / *não com o molde.*"
- "*onde a técnica* / encontra o cuidado."
- "todos os / *procedimentos*"

A regra prática: a serifa carrega a parte emocional da frase, o sans carrega a
parte descritiva. Se as duas linhas são descritivas, não use serifa.

Exceção: números grandes (`+25 anos`, `15 mil`) usam serifa **regular**, não
itálica, porque itálico em algarismo fica instável.

## Hierarquia de uma seção

O padrão que se repete na página inteira, de cima para baixo:

1. micro-rótulo mono em caixa alta, cor `--roxo` (ou `--lilas` no escuro)
2. título display, com a linha de serifa
3. corpo
4. grade ou lista
5. ação

Manter essa ordem é o que faz seções diferentes parecerem da mesma página.

## Fundos alternados

A página respira alternando: `--papel` → escuro → `--papel` → `--papel-2` →
escuro. Duas seções escuras seguidas pesam; duas claras seguidas somem uma na
outra. Ao inserir seção nova, olhe a vizinhança antes de escolher o fundo.

Sobre `--tinta`, o texto principal é `--papel` e os secundários são o creme com
opacidade (`--creme-82`, `--creme-70`, `--creme-62`, `--creme-42`) — não use
cinza, que suja o tom quente.

## Botões

| Classe | Fundo | Uso |
|---|---|---|
| `.botao--creme` | `--papel` + disco `--tinta` | ação principal sobre fundo escuro |
| `.botao--tinta` | `--tinta` + disco `--papel` | ação principal sobre creme |
| `.botao--fantasma` | transparente, borda fina | ações secundárias sobre escuro |
| `.botao--marrom` | `--marrom`, canto 4px | CTA do Repigment (único quadrado) |
| `.card-cat__botao` | `#F8F4EB` | "Ver valores →" nos cards |

Todos são pill (`border-radius: 999px`), exceto o marrom. O disco escuro com a
seta inclinada é assinatura da casa — o principal sempre tem.

Ícones são SVG Lucide inline com `stroke="currentColor"`, para herdarem a cor do
botão em cada estado. Nunca emoji, nunca glifo tipográfico (`↗`, `◎`): eles
mudam de forma conforme o sistema operacional.

## Placeholder de foto

Enquanto não há foto real, o padrão é: fundo pastel + hachuras diagonais em
`repeating-linear-gradient` + etiqueta branca arredondada com o nome em mono
minúsculo ("foto microblading").

Pastéis por categoria: `--pastel-rosa` #FBEFEF, `--pastel-lilas` #F3EDF8,
`--pastel-azul` #ECF3F8, `--pastel-pink` #FBECF2, `--pastel-ambar` #FAF2E4.

A função `midia()` em `index.js` já troca automaticamente por `<img>` quando o
registro do JSON tem o campo `foto` preenchido, e volta ao placeholder se o
arquivo faltar. Não crie caminho paralelo para isso.
