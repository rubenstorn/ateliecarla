# Painel administrativo — React + TypeScript + Tailwind + shadcn

Aplicativo separado da landing page. A página do site continua HTML
estático em `../index.html`; este painel é um SPA que fala com o mesmo
banco no Supabase.

## Rodar

```bash
npm --prefix painel install     # só na primeira vez
npm --prefix painel run dev     # abre em http://localhost:4322
```

No Windows, se o PowerShell reclamar de "execução de scripts desabilitada",
use `npm.cmd` em vez de `npm`.

Antes de entrar, copie `.env.example` para `.env` e preencha as duas chaves
do Supabase — o passo a passo está em `../backend/README.md`.

### Revisar o visual sem banco

```
http://localhost:4322/__previa
```

Mostra o painel montado com dados fictícios, sem login. Essa rota só existe
em desenvolvimento (`import.meta.env.DEV`) e é removida do build — conferido:
a string `__previa` não aparece no pacote final.

## Publicar

```bash
npm --prefix painel run build
```

Gera `painel/dist/`. Publique o conteúdo dessa pasta como a subpasta
`/admin` do site. Como é uma SPA com rotas, configure a hospedagem para
devolver o `index.html` em qualquer caminho de `/admin/*` (no Netlify e no
Cloudflare Pages isso é um redirect `/admin/* /admin/index.html 200`).

## Estrutura

```
painel/
├── components.json          config do shadcn (aliases, estilo new-york)
├── vite.config.ts           alias "@/" + plugin do Tailwind 4
├── tsconfig.app.json        paths "@/*" — precisa casar com o vite.config
├── .env.example             chaves do Supabase (o .env real não vai pro git)
└── src/
    ├── index.css            tokens de tema com a paleta do ateliê
    ├── main.tsx
    ├── App.tsx              sessão, rotas e portão de autenticação
    ├── vite-env.d.ts        tipos de import.meta.env
    ├── lib/
    │   ├── utils.ts         cn(), formatação de data e telefone
    │   └── supabase.ts      cliente + tipos das tabelas
    ├── components/
    │   ├── ui/              primitivos do shadcn
    │   │   ├── avatar.tsx  button.tsx  card.tsx  input.tsx  label.tsx
    │   │   └── sign-in-6.tsx    tela de login
    │   └── layout/Shell.tsx sidebar + header + widget de métrica
    └── pages/
        ├── Dashboard.tsx    métricas + últimos contatos
        ├── Contatos.tsx     CRM completo
        ├── EmBreve.tsx      aponta para o painel antigo
        └── Previa.tsx       revisão visual (só em dev)
```

`components/ui` é o caminho que o shadcn assume por padrão e está declarado
em `components.json`. Mantenha os primitivos ali: o comando
`npx shadcn@latest add <componente>` grava nesse lugar, e mudar o caminho
faria cada adição futura cair na pasta errada.

## Sobre o template usado no login

O componente veio do `sign-in-6`. A estrutura foi preservada — card de duas
colunas, painel esquerdo em gradiente com esfera desfocada, formulário à
direita. O conteúdo mudou:

| Original | Aqui | Por quê |
|---|---|---|
| "Continue with Google" | removido | exige projeto no Google Cloud e tela de consentimento; botão que não funciona é pior que botão nenhum |
| 3 avatares do Unsplash + "Join 40,000+ teams" | removidos | fotos de desconhecidos e prova social falsa num painel privado de uma profissional |
| "Acme" | logotipo do ateliê | — |
| "Start free trial" | removido | não existe cadastro público; a conta é criada por você no Supabase |

Para ligar o Google depois: Supabase › Authentication › Providers › Google.
Aí o botão volta a fazer sentido.

## Sobre a paleta

O layout segue o CoreUI, medido no demo em execução: sidebar de **256px**,
header de 64px, cards com raio de **6px**, faixa de quatro widgets de métrica
em cor sólida.

As cores são as do ateliê, convertidas de hex para oklch por cálculo:

| Marca | Hex | oklch |
|---|---|---|
| creme | `#FAF0DC` | `oklch(0.9577 0.0285 84.59)` |
| tinta | `#1B1714` | `oklch(0.2082 0.0087 59.15)` |
| roxo | `#734C80` | `oklch(0.4805 0.0929 317.38)` |
| roxo escuro | `#5C3D67` | `oklch(0.4128 0.0777 316.90)` |
| lilás | `#C9A6D6` | `oklch(0.7720 0.0772 316.80)` |
| marrom | `#684322` | `oklch(0.4181 0.0697 60.75)` |

Os quatro widgets usam roxo, marrom, roxo escuro e tinta — no lugar do
azul/laranja/vermelho genéricos do CoreUI.

No build o minificador reescreve `oklch(0.4805 …)` como `oklch(48.05% …)`.
É a mesma cor, notação equivalente.

## Uma armadilha do Tailwind 4 que custou tempo

A gaveta lateral do celular usa `-translate-x-64` (pixels), **não**
`-translate-x-full` (porcentagem). Com a porcentagem, a transição interpola
de `-100%` para `0px` — unidades diferentes — e fica travada no valor
inicial: a barra nunca aparecia, embora a classe estivesse correta e
`--tw-translate-x` já valesse `0px`.

Confirmado medindo: com `transition: none` o valor pulava para `0px` na hora.
Com pixels, a animação roda direito (`-256 → -254 → -105 → 0` em ~300 ms).

Se você criar outra gaveta ou painel deslizante, use medida fixa.

## As seis áreas

| Área | O que faz | Efeito no site |
|---|---|---|
| **Visão geral** | 4 métricas + últimos contatos | — |
| **Contatos** | CRM: status, anotações, filtro, busca, WhatsApp, CSV | — |
| **Abertura** | título, subtítulo e botão do topo, com prévia da tipografia | imediato |
| **Vídeos** | link do YouTube/Vimeo, capa automática, publicar/despublicar | imediato |
| **Imagens** | envio por arrastar, grade, texto alternativo, copiar URL | imediato |
| **Busca e SEO** | meta tags, com prévia do Google e do card do WhatsApp | **exige `publicar.js`** |

Vídeos e imagens entram como **rascunho**: só aparecem no site depois de
marcar “no site”. As seções de vídeo e galeria ficam escondidas na landing
page enquanto não houver nada publicado — a página nunca mostra bloco vazio.

## Painel único

Existiu um painel anterior em `../admin/`, em HTML e JavaScript puro. Ele foi
**removido** quando estas quatro áreas foram migradas para cá — manter a mesma
tela em dois lugares só gera divergência.

Se precisar dele por algum motivo, está no histórico do git:

```bash
git checkout 79353b1 -- admin/
```

O que **não** foi removido é a pasta `../api/`: ela continua sendo usada pela
landing page para o formulário de contato, os vídeos e a galeria.

## Verificado

- `tsc -b --noEmit`: zero erros
- `npm run build`: passa — 445 KB de JS (129 KB comprimido), 30 KB de CSS (6 KB)
- Login renderiza com a paleta da marca; campos travados e aviso correto quando o `.env` não está preenchido
- Sidebar de 256 px na cor tinta, header de 64 px, quatro widgets de 6 px de raio nas cores da marca
- Gaveta do celular abre, fecha no véu e não gera rolagem horizontal
- Nenhum erro de console

**Não verificado:** nada foi testado contra um Supabase real — não existe
projeto criado. Login, leitura de contatos e gravação de status estão
escritos e compilam, mas não foram exercitados contra o banco.
