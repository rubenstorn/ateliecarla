-- =============================================================
-- Ateliê Carla Denise — schema do banco
--
-- Cole este arquivo inteiro no SQL Editor do Supabase e execute.
-- É idempotente: pode rodar de novo sem duplicar nada.
--
-- Ver backend/README.md para o passo a passo completo.
-- =============================================================

-- -------------------------------------------------------------
-- Extensões
-- -------------------------------------------------------------

create extension if not exists "pgcrypto";   -- gen_random_uuid()

-- -------------------------------------------------------------
-- Função de timestamp automático
-- -------------------------------------------------------------

create or replace function public.tocar_atualizado_em()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

-- =============================================================
-- 1. HERO — bloco de abertura da página
--
-- Tabela de linha única (singleton): o CHECK em id garante que
-- nunca exista uma segunda linha, então o painel não precisa
-- escolher "qual hero" editar.
-- =============================================================

create table if not exists public.hero (
  id              smallint primary key default 1 check (id = 1),

  selo            text    not null default '' check (char_length(selo) <= 120),
  titulo          text    not null default '' check (char_length(titulo) <= 200),
  titulo_destaque text    not null default '' check (char_length(titulo_destaque) <= 200),
  subtitulo       text    not null default '' check (char_length(subtitulo) <= 600),

  cta_texto       text    not null default '' check (char_length(cta_texto) <= 60),
  cta_url         text    not null default '' check (char_length(cta_url) <= 500),

  atualizado_em   timestamptz not null default now()
);

comment on table public.hero is
  'Bloco de abertura. Linha única. O título é dividido em duas partes: "titulo" sai em peso normal e "titulo_destaque" sai em serifa itálica roxa.';

drop trigger if exists hero_atualizado_em on public.hero;
create trigger hero_atualizado_em
  before update on public.hero
  for each row execute function public.tocar_atualizado_em();

-- =============================================================
-- 2. VIDEOS — galeria de vídeos
-- =============================================================

create table if not exists public.videos (
  id            uuid primary key default gen_random_uuid(),

  titulo        text not null check (char_length(titulo) between 1 and 200),
  descricao     text          check (char_length(descricao) <= 1000),
  url           text not null check (char_length(url) between 1 and 500),
  thumbnail_url text          check (char_length(thumbnail_url) <= 500),

  ordem         integer not null default 0,
  publicado     boolean not null default false,

  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

comment on table public.videos is
  'Galeria de vídeos. "url" aceita link do YouTube/Vimeo ou arquivo no Storage. Só linhas com publicado = true aparecem no site.';

create index if not exists videos_ordem_idx
  on public.videos (publicado, ordem, criado_em desc);

drop trigger if exists videos_atualizado_em on public.videos;
create trigger videos_atualizado_em
  before update on public.videos
  for each row execute function public.tocar_atualizado_em();

-- =============================================================
-- 3. MIDIAS — imagens e trabalhos do ateliê
-- =============================================================

create table if not exists public.midias (
  id          uuid primary key default gen_random_uuid(),

  titulo      text not null check (char_length(titulo) between 1 and 200),
  imagem_url  text not null check (char_length(imagem_url) between 1 and 500),

  -- texto alternativo: obrigatório na prática, para acessibilidade
  alt         text not null default '' check (char_length(alt) <= 300),

  -- agrupador livre: 'galeria', 'antes-depois', 'ateliê', 'capa-categoria'…
  grupo       text not null default 'galeria' check (char_length(grupo) <= 60),

  largura     integer check (largura > 0),
  altura      integer check (altura > 0),

  ordem       integer not null default 0,
  publicado   boolean not null default false,

  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

comment on table public.midias is
  'Imagens gerenciadas pelo painel. "grupo" separa onde a imagem aparece. largura/altura são gravadas no upload para evitar salto de layout.';

create index if not exists midias_grupo_idx
  on public.midias (grupo, publicado, ordem, criado_em desc);

drop trigger if exists midias_atualizado_em on public.midias;
create trigger midias_atualizado_em
  before update on public.midias
  for each row execute function public.tocar_atualizado_em();

-- =============================================================
-- 4. SEO — configurações globais
--
-- Também singleton. Estes campos NÃO são aplicados por
-- JavaScript no navegador: eles são gravados no index.html pelo
-- script backend/publicar.js. Ver README, seção "Por que SEO
-- não é dinâmico".
-- =============================================================

create table if not exists public.seo (
  id               smallint primary key default 1 check (id = 1),

  meta_title       text not null default '' check (char_length(meta_title) <= 70),
  meta_description text not null default '' check (char_length(meta_description) <= 200),
  og_title         text check (char_length(og_title) <= 200),
  og_description   text check (char_length(og_description) <= 400),
  og_image_url     text not null default '' check (char_length(og_image_url) <= 500),
  canonical_url    text not null default '' check (char_length(canonical_url) <= 500),

  atualizado_em    timestamptz not null default now()
);

comment on column public.seo.meta_title is
  'Limite de 70 caracteres: o Google corta o título acima disso.';
comment on column public.seo.meta_description is
  'Limite de 200: o Google exibe ~155-160, o resto é cortado.';
comment on column public.seo.og_title is
  'Título do card do WhatsApp/Instagram/Facebook. Se vazio, publicar.js usa meta_title.';
comment on column public.seo.og_description is
  'Descrição do card do WhatsApp/Instagram/Facebook. Se vazia, publicar.js usa meta_description.';

drop trigger if exists seo_atualizado_em on public.seo;
create trigger seo_atualizado_em
  before update on public.seo
  for each row execute function public.tocar_atualizado_em();

-- =============================================================
-- 5. CATALOGO — categorias e procedimentos da tabela de preços
--
-- Fonte de verdade migrada de dados/catalogo.json para cá. O
-- arquivo estático continua existindo porque é ele que o site
-- lê (fetch direto, sem depender do Supabase no ar): rode
-- "node ferramentas/exportar-catalogo.mjs" depois de editar no
-- painel para regravá-lo antes de publicar.
-- =============================================================

create table if not exists public.catalogo_config (
  id            smallint primary key default 1 check (id = 1),

  vigencia      text not null default '' check (char_length(vigencia) <= 60),
  agendamento   text not null default '' check (char_length(agendamento) <= 500),

  atualizado_em timestamptz not null default now()
);

comment on table public.catalogo_config is
  'Linha única. "vigencia" é o texto de rodapé da tabela de preços; "agendamento" é o link padrão de agendar quando a categoria não tem um próprio.';

insert into public.catalogo_config (id) values (1) on conflict (id) do nothing;

drop trigger if exists catalogo_config_atualizado_em on public.catalogo_config;
create trigger catalogo_config_atualizado_em
  before update on public.catalogo_config
  for each row execute function public.tocar_atualizado_em();

create table if not exists public.catalogo_categorias (
  id            uuid primary key default gen_random_uuid(),

  titulo        text not null check (char_length(titulo) between 1 and 120),
  tom           text not null default 'rosa' check (tom in ('rosa', 'lilas', 'azul', 'verde', 'dourado')),
  preco_partir  text not null default '' check (char_length(preco_partir) <= 40),
  tempo         text not null default '' check (char_length(tempo) <= 60),
  foto_url      text check (char_length(foto_url) <= 500),
  etiqueta      text not null default '' check (char_length(etiqueta) <= 120),

  ordem         integer not null default 0,

  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

comment on table public.catalogo_categorias is
  'Categorias da grade do catálogo (ex.: "Micropigmentação"). "tom" escolhe a cor do cartão no site.';

create index if not exists catalogo_categorias_ordem_idx
  on public.catalogo_categorias (ordem, titulo);

drop trigger if exists catalogo_categorias_atualizado_em on public.catalogo_categorias;
create trigger catalogo_categorias_atualizado_em
  before update on public.catalogo_categorias
  for each row execute function public.tocar_atualizado_em();

create table if not exists public.catalogo_itens (
  id            uuid primary key default gen_random_uuid(),
  categoria_id  uuid not null references public.catalogo_categorias(id) on delete cascade,

  nome          text not null check (char_length(nome) between 1 and 150),
  preco         text not null default '' check (char_length(preco) <= 40),
  duracao       text not null default '' check (char_length(duracao) <= 40),
  foto_url      text check (char_length(foto_url) <= 500),
  etiqueta      text not null default '' check (char_length(etiqueta) <= 120),

  ordem         integer not null default 0,

  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

comment on table public.catalogo_itens is
  'Procedimentos dentro de uma categoria (ex.: "Microblading"). Preço e duração são texto livre porque aparecem prontos no site, sem formatação.';

create index if not exists catalogo_itens_categoria_idx
  on public.catalogo_itens (categoria_id, ordem, nome);

drop trigger if exists catalogo_itens_atualizado_em on public.catalogo_itens;
create trigger catalogo_itens_atualizado_em
  before update on public.catalogo_itens
  for each row execute function public.tocar_atualizado_em();

-- =============================================================
-- 6. LEADS — CRM básico
--
-- ATENÇÃO: esta tabela guarda dado pessoal (nome, telefone).
-- As políticas abaixo permitem que o público INSIRA um lead mas
-- NUNCA leia a lista. Só quem está logado enxerga os registros.
-- =============================================================

create table if not exists public.leads (
  id          uuid primary key default gen_random_uuid(),

  nome        text not null check (char_length(nome) between 2 and 150),
  telefone    text not null check (char_length(telefone) between 8 and 30),
  email       text          check (char_length(email) <= 200),

  procedimento text         check (char_length(procedimento) <= 200),
  mensagem     text         check (char_length(mensagem) <= 2000),

  -- de onde veio: 'formulario-site', 'instagram', 'indicacao'…
  origem      text not null default 'formulario-site' check (char_length(origem) <= 80),

  status      text not null default 'novo'
              check (status in ('novo', 'contatado', 'agendado', 'atendido', 'perdido')),

  -- anotações internas da Carla; o público nunca escreve aqui
  observacoes text check (char_length(observacoes) <= 2000),

  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

comment on table public.leads is
  'Contatos capturados no formulário. Dado pessoal sob LGPD: público insere, só autenticado lê.';

create index if not exists leads_status_idx on public.leads (status, criado_em desc);
create index if not exists leads_criado_idx on public.leads (criado_em desc);

drop trigger if exists leads_atualizado_em on public.leads;
create trigger leads_atualizado_em
  before update on public.leads
  for each row execute function public.tocar_atualizado_em();

-- =============================================================
-- ROW LEVEL SECURITY
--
-- Sem isto, a chave anon que fica exposta no navegador daria
-- acesso total ao banco. Com RLS ligado e as políticas abaixo,
-- a chave anon só consegue: ler conteúdo publicado e inserir um
-- lead. Nada mais.
-- =============================================================

alter table public.hero               enable row level security;
alter table public.videos             enable row level security;
alter table public.midias             enable row level security;
alter table public.seo                enable row level security;
alter table public.catalogo_config    enable row level security;
alter table public.catalogo_categorias enable row level security;
alter table public.catalogo_itens     enable row level security;
alter table public.leads              enable row level security;

-- ---- HERO ----------------------------------------------------

drop policy if exists "hero: leitura pública" on public.hero;
create policy "hero: leitura pública"
  on public.hero for select
  to anon, authenticated
  using (true);

drop policy if exists "hero: escrita autenticada" on public.hero;
create policy "hero: escrita autenticada"
  on public.hero for all
  to authenticated
  using (true) with check (true);

-- ---- VIDEOS --------------------------------------------------

-- o público só vê o que está publicado
drop policy if exists "videos: leitura pública do publicado" on public.videos;
create policy "videos: leitura pública do publicado"
  on public.videos for select
  to anon
  using (publicado = true);

drop policy if exists "videos: leitura total autenticada" on public.videos;
create policy "videos: leitura total autenticada"
  on public.videos for select
  to authenticated
  using (true);

drop policy if exists "videos: escrita autenticada" on public.videos;
create policy "videos: escrita autenticada"
  on public.videos for all
  to authenticated
  using (true) with check (true);

-- ---- MIDIAS --------------------------------------------------

drop policy if exists "midias: leitura pública do publicado" on public.midias;
create policy "midias: leitura pública do publicado"
  on public.midias for select
  to anon
  using (publicado = true);

drop policy if exists "midias: leitura total autenticada" on public.midias;
create policy "midias: leitura total autenticada"
  on public.midias for select
  to authenticated
  using (true);

drop policy if exists "midias: escrita autenticada" on public.midias;
create policy "midias: escrita autenticada"
  on public.midias for all
  to authenticated
  using (true) with check (true);

-- ---- SEO -----------------------------------------------------

drop policy if exists "seo: leitura pública" on public.seo;
create policy "seo: leitura pública"
  on public.seo for select
  to anon, authenticated
  using (true);

drop policy if exists "seo: escrita autenticada" on public.seo;
create policy "seo: escrita autenticada"
  on public.seo for all
  to authenticated
  using (true) with check (true);

-- ---- CATALOGO --------------------------------------------------

drop policy if exists "catalogo_config: leitura pública" on public.catalogo_config;
create policy "catalogo_config: leitura pública"
  on public.catalogo_config for select
  to anon, authenticated
  using (true);

drop policy if exists "catalogo_config: escrita autenticada" on public.catalogo_config;
create policy "catalogo_config: escrita autenticada"
  on public.catalogo_config for all
  to authenticated
  using (true) with check (true);

drop policy if exists "catalogo_categorias: leitura pública" on public.catalogo_categorias;
create policy "catalogo_categorias: leitura pública"
  on public.catalogo_categorias for select
  to anon, authenticated
  using (true);

drop policy if exists "catalogo_categorias: escrita autenticada" on public.catalogo_categorias;
create policy "catalogo_categorias: escrita autenticada"
  on public.catalogo_categorias for all
  to authenticated
  using (true) with check (true);

drop policy if exists "catalogo_itens: leitura pública" on public.catalogo_itens;
create policy "catalogo_itens: leitura pública"
  on public.catalogo_itens for select
  to anon, authenticated
  using (true);

drop policy if exists "catalogo_itens: escrita autenticada" on public.catalogo_itens;
create policy "catalogo_itens: escrita autenticada"
  on public.catalogo_itens for all
  to authenticated
  using (true) with check (true);

-- ---- LEADS ---------------------------------------------------
--
-- A política mais importante do arquivo. Repare que o público
-- tem INSERT e NÃO tem SELECT: o formulário grava, mas ninguém
-- de fora consegue baixar a lista de clientes.

drop policy if exists "leads: público insere" on public.leads;
create policy "leads: público insere"
  on public.leads for insert
  to anon
  with check (
    -- o público não pode escolher status nem escrever observação
    status = 'novo'
    and observacoes is null
  );

drop policy if exists "leads: só autenticado lê" on public.leads;
create policy "leads: só autenticado lê"
  on public.leads for select
  to authenticated
  using (true);

drop policy if exists "leads: só autenticado atualiza" on public.leads;
create policy "leads: só autenticado atualiza"
  on public.leads for update
  to authenticated
  using (true) with check (true);

drop policy if exists "leads: só autenticado apaga" on public.leads;
create policy "leads: só autenticado apaga"
  on public.leads for delete
  to authenticated
  using (true);

-- =============================================================
-- STORAGE — bucket de imagens
--
-- Leitura pública (as fotos precisam aparecer no site),
-- escrita só autenticada (só a Carla envia arquivo).
-- =============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'midias',
  'midias',
  true,
  5242880,                                       -- 5 MB por arquivo
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
  set public = true,
      file_size_limit = 5242880,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

drop policy if exists "midias: download público" on storage.objects;
create policy "midias: download público"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'midias');

drop policy if exists "midias: upload autenticado" on storage.objects;
create policy "midias: upload autenticado"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'midias');

drop policy if exists "midias: substituição autenticada" on storage.objects;
create policy "midias: substituição autenticada"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'midias');

drop policy if exists "midias: remoção autenticada" on storage.objects;
create policy "midias: remoção autenticada"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'midias');

-- =============================================================
-- VIEW de apoio para o painel: resumo dos leads por status
-- =============================================================

create or replace view public.leads_resumo
with (security_invoker = true)     -- respeita a RLS de quem consulta
as
  select
    status,
    count(*)                                             as total,
    count(*) filter (where criado_em > now() - interval '7 days')  as ultimos_7_dias,
    max(criado_em)                                       as mais_recente
  from public.leads
  group by status;

comment on view public.leads_resumo is
  'Contagem por status para o dashboard. security_invoker faz a view herdar a RLS de leads, então anon não lê nada por aqui.';
