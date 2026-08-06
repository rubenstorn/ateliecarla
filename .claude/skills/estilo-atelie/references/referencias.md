# Como analisar um site de referência

O usuário manda um link, um print ou um nome ("faz tipo o site da Aesop"). O
objetivo é extrair o **mecanismo** e descartar a **superfície**. Este arquivo
detalha o passo 1 e 3 do fluxo do `SKILL.md`.

## Abrindo a referência

```
preview_start { url: "https://exemplo.com" }
read_page                     → estrutura e textos
computer { action: "scroll" } → ver o que acontece ao rolar
computer { action: "hover" }  → estados de interação
javascript_tool               → ler valores computados
```

`javascript_tool` é o que mais rende. Em vez de estimar no olho:

```js
getComputedStyle(el).transitionDuration
getComputedStyle(el).transitionTimingFunction
getComputedStyle(el).fontSize + ' / ' + getComputedStyle(el).lineHeight
[...document.styleSheets].flatMap(s => { try { return [...s.cssRules] } catch(e) { return [] } })
  .filter(r => r.type === CSSRule.KEYFRAMES_RULE).map(r => r.name)
```

Isso dá o timing real, não o que parece. A diferença entre 0,3s e 0,6s é o que
separa "elegante" de "arrastado", e não dá para chutar.

Se o site bloquear acesso ou pedir login, diga ao usuário e peça um print. Não
invente o que você não viu.

## O que perguntar de cada tipo de referência

**Animação de scroll** — o elemento entra por baixo, por lado, ou só desaparece
o opacity? Qual o atraso entre irmãos? O efeito reverte quando sobe de volta ou
acontece uma vez só? (Aqui é sempre uma vez — o observer dá `unobserve`.)

**Hover** — o que muda: elevação, cor, escala, borda? Em quanto tempo? A saída
usa a mesma duração da entrada ou é mais rápida?

**Tipografia** — qual a razão entre o maior e o menor tamanho da página? Onde
está o contraste de peso? O display tem tracking negativo?

**Grade** — quantas colunas em cada largura? O respiro entre cards é maior ou
menor que o padding interno? Os cards têm altura igual ou acompanham o conteúdo?

**Transição entre telas** — cobre, desliza, ou dissolve? De onde nasce?

**Densidade** — quanto espaço vazio existe em volta do conteúdo? Esse costuma
ser o traço mais copiável e o mais esquecido: sites que "parecem caros" quase
sempre têm mais respiro do que a intuição pede.

## A tradução

Monte mentalmente esta tabela antes de escrever código:

| Na referência | Nesta página |
|---|---|
| cor de acento | `--roxo` (claro) ou `--lilas` (escuro) |
| fundo escuro | `--tinta` |
| fundo claro | `--papel` ou `--papel-2` |
| fonte display | Instrument Sans SemiBold |
| detalhe elegante | Instrument Serif itálico |
| rótulo pequeno | JetBrains Mono, caixa alta, `letter-spacing: .24em` |
| curva de entrada | `--suave` |
| curva de painel | `--veludo` |
| duração de hover | 0,2s |
| duração de entrada | 1,1s |

Se algo não tem correspondência — um verde, um degradê de três cores, uma fonte
condensada — pare e pergunte ao usuário. Introduzir cor nova é decisão de marca,
não de implementação.

## O que nunca se copia

Arquivos CSS ou JavaScript da referência, imagens, ícones, textos, nome, logo,
ou o layout inteiro de uma página a ponto de o resultado ser confundível com o
original. Isso é material protegido e não é o que o usuário quer de verdade —
ele quer a *sensação* daquele site na marca dele.

Padrão de interação, timing, proporção, densidade e hierarquia não são
protegidos. É daí que vem o valor.

Se o pedido for literalmente "clona esse site", diga o que dá para fazer:
reproduzir a estrutura e os padrões com a identidade do Ateliê. Ofereça isso e
siga em frente.

## Fechando

Ao entregar, diga em uma frase o que foi trazido da referência e o que foi
traduzido. Algo como: "Trouxe a cascata dos cards com 80ms de atraso e a grade
de 3 colunas; a cor de acento virou `--roxo` e o rótulo foi para mono, como no
resto da página." Isso deixa o usuário conferir a decisão em vez de descobrir
depois que a página ficou com dois idiomas visuais.
