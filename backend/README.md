# Backend e painel — Ateliê Carla Denise

Banco de dados, autenticação e painel administrativo em **Supabase**.

## Por que Supabase (e não Strapi ou Next.js)

O Supabase é Postgres hospedado que já vem com API REST automática,
autenticação com login/senha e armazenamento de arquivos.

Consequência prática: **as "API routes" pedidas não são necessárias.** O
Supabase *é* a API. Não há servidor Node para manter ligado, não há
mensalidade de hospedagem de backend, e a landing page continua sendo HTML
estático — todo o trabalho anterior (catálogo, WebGL, JSON) segue de pé.

Strapi exigiria um servidor Node 24h no ar (~R$ 30–80/mês, atualizações de
segurança, banco separado). Next.js exigiria reescrever a página inteira em
React. Nenhum dos dois entrega nada a mais para este caso.

## Arquivos

```
backend/
├── schema.sql      tabelas, índices, RLS, bucket de imagens
├── seed.sql        conteúdo atual da página, migrado
├── publicar.js     grava SEO e hero do banco no index.html
└── README.md

api/
├── config.js       URL e chave do Supabase  ← PREENCHER
├── cliente.js      cliente compartilhado
├── conteudo.js     leitura pública + gravação de lead
└── landing.js      liga a landing page ao banco

admin/
├── index.html      login + painel
├── admin.css
└── admin.js
```

## Instalação — 6 passos

### 1. Criar o projeto

Em [supabase.com](https://supabase.com), crie uma conta e um projeto novo.
Região: **South America (São Paulo)** — o banco fica no Brasil, o site
responde mais rápido e o dado pessoal não sai do país.

Guarde a senha do banco que ele pedir. O plano free basta com folga aqui.

### 2. Criar as tabelas

No projeto: **SQL Editor** › **New query**. Cole o conteúdo inteiro de
`backend/schema.sql` e clique em **Run**.

Depois repita com `backend/seed.sql` — ele preenche o banco com os textos que
já estão na página, para o painel abrir com conteúdo real.

Os dois arquivos podem ser rodados de novo sem duplicar nada.

### 3. Pegar as chaves

**Project Settings** › **API**. Copie:

- **Project URL** → cole em `SUPABASE_URL` no `api/config.js`
- **anon public** → cole em `SUPABASE_ANON_KEY` no `api/config.js`

⛔ **Nunca copie a `service_role`.** Ela ignora toda a segurança do banco e
só serve para uso em servidor. A que vai no navegador é a `anon`.

Sobre a chave `anon` ficar visível no código: é o desenho do Supabase e está
correto. Quem protege o banco são as políticas de RLS do `schema.sql`, não o
segredo da chave. Com elas ativas, quem tem a chave `anon` consegue ler
conteúdo publicado e cadastrar um lead — e nada mais.

### 4. Criar o login da Carla

**Authentication** › **Users** › **Add user** › **Create new user**.

Preencha e-mail e senha, e marque **Auto Confirm User** (sem isso ela
precisaria clicar num link de confirmação).

Depois, em **Authentication** › **Providers** › **Email**, desligue
**Enable sign ups**. Isso impede que qualquer pessoa crie conta no painel —
só quem você cadastrar entra.

### 5. Abrir o painel

Com o servidor do projeto rodando:

```bash
npx -y serve -l 4321 .
```

Acesse `http://localhost:4321/admin/`. Entre com o e-mail e a senha do
passo 4.

### 6. Publicar

Ao subir o site para a hospedagem, o painel vai junto, em
`seudominio.com.br/admin/`. Ele não aparece em busca (tem `noindex`) e não
tem link a partir do site.

## As cinco áreas do painel

| Aba | O que faz | Efeito no site |
|---|---|---|
| **Contatos** | lista quem preencheu o formulário, muda status, anota, exporta CSV | — |
| **Abertura** | título, subtítulo e botão do hero | imediato |
| **Vídeos** | cadastra link do YouTube/Vimeo | imediato |
| **Imagens** | envia fotos por arrastar | imediato |
| **SEO** | título, descrição e imagem de compartilhamento | **exige rodar o publicar.js** |

Vídeos e imagens entram como **rascunho**. Só aparecem no site depois de
marcar "no site" — assim nada meio-pronto vaza para a cliente.

As seções de vídeo e galeria ficam **escondidas** enquanto não houver
conteúdo publicado. A página nunca mostra um bloco vazio.

## Por que SEO não é dinâmico

Buscadores e os robôs de prévia de WhatsApp, Instagram e Facebook **não
executam JavaScript**. Uma meta tag preenchida pelo navegador é invisível
para eles: o link compartilhado apareceria sem título e sem imagem.

Então o painel guarda o SEO no banco, e quem escreve no arquivo é o script:

```bash
node backend/publicar.js --conferir   # mostra o que mudaria
node backend/publicar.js              # grava no index.html
```

Ele reescreve dois blocos do `index.html`, delimitados por marcadores
`<!-- @gerado:… -->`: as meta tags e o título do hero. Faz cópia de segurança
em `index.html.bak` antes de gravar. Não tem dependência: usa o `fetch` do
Node 18+.

Depois de rodar, publique o site.

**Se você reescrever o `index.html` à mão, mantenha os marcadores.** Sem eles
o script para com erro explicando o que faltou — de propósito, para não
adivinhar onde gravar.

## Segurança — o que está protegido e como

As políticas de RLS estão no fim do `schema.sql`. Em resumo:

| Tabela | Público (chave anon) | Logado |
|---|---|---|
| `hero`, `seo` | só leitura | leitura e escrita |
| `videos`, `midias` | leitura **só do publicado** | tudo |
| `leads` | **só inserir** | ler, editar, apagar |
| Storage `midias` | só baixar | enviar, trocar, apagar |

A linha mais importante é a dos leads: o público insere, mas **não tem
SELECT**. Ninguém de fora consegue baixar a lista de clientes da Carla. A
política também recusa que o público escolha o `status` ou escreva em
`observacoes`.

### O que ainda falta para o formulário

Existe um campo-isca escondido que barra robô simples. **Isso não é captcha.**
Se começar a chegar spam, a solução é Cloudflare Turnstile (gratuito) numa
Edge Function do Supabase validando antes do insert. Não fiz agora porque
depende do domínio estar definido.

## LGPD

A tabela `leads` guarda nome e telefone: dado pessoal. Três pontos práticos:

1. O formulário avisa que o dado é usado só para aquele contato.
2. A região São Paulo mantém o dado no Brasil.
3. Falta uma página de política de privacidade — passa a ser exigível a
   partir do momento em que o formulário entra no ar.

Fotos de rosto de cliente são dado pessoal também, e precisam de autorização
de uso de imagem por escrito. O caminho mais simples é uma cláusula na ficha
de anamnese.

## O que eu não pude testar

Escrevi e validei a sintaxe de todos os arquivos, mas **não existe projeto
Supabase criado**, então nada aqui foi executado contra um banco real. Não
verifiquei: se o `schema.sql` roda sem erro, se as políticas de RLS se
comportam como descrito, se o login funciona, nem se o upload de imagem
grava no bucket.

Quando você criar o projeto e rodar os dois arquivos SQL, me diga — eu testo
o fluxo inteiro no navegador e corrijo o que aparecer.
