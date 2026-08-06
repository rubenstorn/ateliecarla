# Receitas de movimento

As animações da página já existem no `index.css`. Antes de escrever keyframe
novo, veja se uma destas resolve — repetir o vocabulário é o que dá unidade.

## As duas curvas

```css
--suave:  cubic-bezier(.16, 1, .3, 1);   /* entrada e hover: sai rápido, chega devagar */
--veludo: cubic-bezier(.76, 0, .24, 1);  /* tela cheia: acelera e desacelera igual */
```

`--suave` é assimétrica de propósito: o elemento parece impulsionado e depois
pousa. `--veludo` é simétrica, boa para painel que cobre a tela, onde os dois
extremos precisam do mesmo peso.

## Entrada de linha (riseIn)

Texto sobe de dentro de uma máscara. Usado nas 4 linhas do hero.

```css
@keyframes riseIn { from { opacity: 0; transform: translateY(110%) } to { opacity: 1; transform: none } }
```

A máscara é o pai com `overflow: hidden`; o filho anima. Sem o par, o texto
aparece invadindo a linha de cima. O atraso entre linhas é de ~130ms — o
suficiente para ler como cascata, não como enfileiramento.

## Entrada de bloco (fadeUp / .rv)

```css
@keyframes fadeUp { from { opacity: 0; transform: translateY(26px) } to { opacity: 1; transform: none } }
```

Para o que já está na dobra, `fadeUp` com `animation-delay`. Para o que entra
no scroll, a classe `.rv` — transição de 1,1s disparada pelo IntersectionObserver
com `threshold: 0.14` e `rootMargin: '0px 0px -8% 0px'`. A margem negativa faz o
elemento revelar um pouco antes de encostar na borda, o que parece mais natural.

Se um bloco novo precisa aparecer no scroll, basta a classe `.rv` — o observer
existente varre `.rv:not(.on)` e cobre elementos criados depois.

## Marquee

Duas cópias idênticas do mesmo grupo lado a lado, animando `translateX` de `0`
a `-50%` em loop linear. A duplicata é o que faz a emenda ser invisível — com
uma só, o conteúdo some e reaparece.

```css
@keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
```

Duração de 34s no desktop. Mais rápido vira distração; mais lento parece travado.

## Véu do loader

`transform: scaleY(1) → 0` com `transform-origin: top`, curva `--veludo`, 0,9s.
Sobe como cortina em vez de sumir — leva o olhar para o conteúdo que fica.

## Menu circular

`clip-path: circle(0% at 92% 6%)` → `circle(150% at 92% 6%)`, 1s, `--veludo`.
O centro coincide com o botão que abriu, então o painel parece nascer do clique.

Detalhe que quebra fácil: o painel precisa sair de `hidden` **antes** de receber
a classe, com um reflow forçado no meio (`void painel.offsetWidth`), senão o
navegador aplica o estado final direto e não há transição. Já está resolvido em
`index.js` — copie o padrão em vez de reinventar.

## Hover de botão

Padrão da casa, tudo em 0,2s: eleva 2px (`translateY(-2px)`), ganha sombra
projetada, e o disco da seta faz `scale(1.1) rotate(8deg)`. No clique,
`scale(.95)` e sombra fora. A rotação mínima da seta é o detalhe que dá vida —
sem ela o botão parece só um retângulo subindo.

## Barra de progresso de leitura

`transform: scaleX()` com `transform-origin: left`, atualizada no scroll dentro
de `requestAnimationFrame`. Use `transform`, nunca `width` — width força layout
a cada quadro e engasga em página longa.

## O que evitar

Animar `width`, `height`, `top`, `left` ou `margin`. Só `transform` e `opacity`
rodam no compositor; o resto recalcula layout e trava em telas fracas.

Efeito que depende de biblioteca externa. A página não tem build nem npm — se
a referência exige GSAP ou Lenis, diga isso e ofereça a versão em CSS puro.

Duração acima de 1,2s em interação. Entrada pode demorar; resposta a clique, não.

## prefers-reduced-motion

O bloco no fim do `index.css` zera durações e neutraliza `.rv`. Toda animação
nova precisa estar coberta — se ela vive num seletor que o bloco não alcança,
adicione. Movimento involuntário provoca enjoo em quem tem sensibilidade
vestibular, e é o tipo de coisa que ninguém reporta, só abandona a página.
