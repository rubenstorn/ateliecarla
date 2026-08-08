# dados/catalogo.json — como mexer

O site lê este arquivo direto (fetch estático, sem depender do Supabase
estar no ar). Não existe mais lista de procedimentos dentro do `index.js`.

**A fonte de verdade agora é o painel** (aba Catálogo, editando o banco).
Depois de editar lá, rode `node ferramentas/exportar-catalogo.mjs` para
regravar este arquivo a partir do banco — `montar-deploy.mjs` lembra disso
antes de publicar.

**Primeira vez configurando o banco?** Depois de rodar `backend/schema.sql`
no SQL Editor do Supabase, as tabelas do catálogo nascem vazias. Para
popular com o que já está neste arquivo, rode uma única vez:

```bash
SUPABASE_SERVICE_ROLE_KEY=xxxxx node ferramentas/importar-catalogo.mjs
```

A chave `service_role` fica em Supabase › Project Settings › API — cole só
no comando, nunca em arquivo. Depois disso, edite pelo painel.

Editar este JSON à mão ainda funciona (o site não distingue a origem), mas
some na próxima exportação. Para uma mudança pontual e definitiva sem abrir
o painel, edite aqui — só não rode o script de exportação depois, ou ele
sobrescreve com o que estiver no banco.

## Trocar um preço

Ache o procedimento e mude o valor. Só isso.

```json
{ "nome": "Nanoblading", "preco": "R$ 400", "duracao": "120 min", "foto": null, "etiqueta": "foto nanoblading" }
```

O texto do rodapé da tabela ("valores de agosto/2026") vem do campo
`vigencia` no topo do arquivo — atualize junto quando reajustar a tabela.

## Colocar uma foto

1. Salve a imagem em `assets/`
2. Troque o `null` do campo `foto` pelo caminho do arquivo

```json
"foto": "assets/capa-micropigmentacao.webp"
```

Pronto. O site troca o retângulo pastel pela foto, com recorte centralizado
automático. **Não precisa mexer em HTML, CSS ou JavaScript.**

Se o caminho estiver errado ou o arquivo faltar, o site volta a mostrar o
retângulo pastel — nunca aparece ícone de imagem quebrada para a cliente.

### Onde cada foto aparece

| Campo | Onde aparece | Quantos | Exportar em |
|---|---|---|---|
| `categorias[].foto` | capa do cartão de categoria | 5 | **720×400** (1,8:1 deitada) |
| `categorias[].itens[].foto` | miniatura ao lado do procedimento | 25 | **240×240** (quadrada) |
| `midia.videoRepigment.foto` | capa do vídeo do Repigment | 1 | **1360×765** (16:9) |

Medidas reais das caixas na tela, para referência:

| Slot | Caixa em CSS px | Proporção | Varia? |
|---|---|---|---|
| Capa de categoria | 285–340 × **180** | 1,6:1 a 1,9:1 | largura varia com o nº de colunas; altura é fixa |
| Miniatura | 82 × 82 | 1:1 | não |
| Capa do vídeo | até 680 × 383 | 16:9 | não |

Os arquivos são exportados no dobro porque telas de celular têm densidade
2× — uma capa de 360 px de largura real precisa de 720 px de arquivo para não
ficar borrada.

As 25 miniaturas **não precisam ser 25 fotos diferentes** — pode repetir a
mesma por categoria. Elas aparecem com 82 pixels na tela.

Todas usam recorte centralizado (`object-fit: cover`). Como a proporção da
capa oscila entre 1,6:1 e 1,9:1 dependendo da tela, o recorte tira ora das
laterais, ora de cima e de baixo: **mantenha o assunto no centro com folga em
todos os lados**. Uma sobrancelha encostada na borda vai ser cortada em alguma
largura de tela.

## Campos de cada registro

| Campo | Obrigatório | Para que serve |
|---|---|---|
| `nome` | sim | nome do procedimento na lista |
| `preco` | sim | texto livre — escreva como deve aparecer (`"R$ 399,90"`) |
| `duracao` | sim | texto livre (`"120 min"`) |
| `foto` | sim (pode ser `null`) | caminho do arquivo, ou `null` para o placeholder |
| `etiqueta` | sim | rótulo do placeholder e texto alternativo de reserva |
| `alt` | não | descrição da foto para leitores de tela; sem ela, usa o `nome` |

Nas categorias, além disso: `id`, `titulo`, `precoPartir`, `tempo` e `tom`
(a cor pastel do placeholder: `rosa`, `lilas`, `azul`, `pink` ou `ambar`).

## Duas armadilhas

**1. Vírgula sobrando quebra o arquivo.** JSON não perdoa uma vírgula depois
do último item de uma lista. Se a tabela sumir do site e aparecer um aviso no
lugar, é quase sempre isso. Cole o arquivo em `jsonlint.com` para achar a
linha.

**2. Os preços estão em dois lugares.** Além deste arquivo, há oito preços
repetidos no bloco `application/ld+json` dentro do `index.html` — é o que o
Google lê para mostrar valores na busca. Eles são estáticos de propósito:
buscador lê HTML com muito mais confiança do que dado montado por JavaScript.

Ao reajustar a tabela, **atualize os dois**. Os oito são: Design de
sobrancelhas, Brow lamination, Microblading, Nanoblading, Micropigmentação
shadow, Repigment, Micropigmentação labial e Delineado dos olhos.

## Precisa de servidor

O site lê este arquivo por `fetch`, e navegador nenhum deixa uma página
abrir arquivo local por `file://`. Ou seja: **abrir o `index.html` com
duplo clique não funciona** — a tabela mostra um aviso.

Para ver o site na sua máquina, use o servidor do projeto:

```bash
npx -y serve -l 4321 .
```

E acesse `http://localhost:4321/index.html`. Publicado em qualquer
hospedagem (Netlify, Cloudflare Pages, Vercel, hospedagem comum), funciona
normalmente — todas servem por `http://`.

## Painel para a Carla editar sozinha

Este arquivo foi desenhado para receber um CMS baseado em git — Decap CMS,
Sveltia CMS ou Pages CMS. Todos funcionam do mesmo jeito: um painel com login
onde ela arrasta a foto e digita o preço, e a ferramenta grava a alteração
neste JSON pelo GitHub. Sem servidor, sem banco de dados, sem mensalidade.

O trabalho de configurar é declarar os campos acima num arquivo de
configuração do CMS escolhido. A estrutura aqui já está no formato que essas
ferramentas esperam (lista de objetos com campos nomeados), então é
configuração, não reescrita.
