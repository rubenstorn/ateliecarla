-- =============================================================
-- Ateliê Carla Denise — conteúdo inicial
--
-- Rode DEPOIS do schema.sql. Preenche o banco com exatamente o
-- que já está escrito no index.html hoje, para o painel abrir
-- com o conteúdo real em vez de campos vazios.
--
-- Idempotente: rodar de novo não duplica (usa upsert).
-- =============================================================

-- -------------------------------------------------------------
-- HERO — o texto que está no index.html hoje
-- -------------------------------------------------------------

insert into public.hero (id, selo, titulo, titulo_destaque, subtitulo, cta_texto, cta_url)
values (
  1,
  'Micropigmentação · Design de sobrancelhas',
  'Sobrancelhas que combinam com o',
  'seu rosto, não com o molde',
  'Micropigmentação e design de sobrancelhas em um ateliê que trabalha um rosto por vez. Cada traço é desenhado a partir do formato do seu rosto, do seu tom de pele e da sua rotina — e aprovado por você antes de a agulha tocar a pele.',
  'Agendar meu horário',
  'https://agendaagil.com/ateliecarla'
)
on conflict (id) do update set
  selo            = excluded.selo,
  titulo          = excluded.titulo,
  titulo_destaque = excluded.titulo_destaque,
  subtitulo       = excluded.subtitulo,
  cta_texto       = excluded.cta_texto,
  cta_url         = excluded.cta_url;

-- -------------------------------------------------------------
-- SEO — as meta tags que estão no index.html hoje
--
-- Troque carladenisebeauty.com.br pelo domínio real quando existir.
-- -------------------------------------------------------------

insert into public.seo (id, meta_title, meta_description, og_title, og_description, og_image_url, canonical_url)
values (
  1,
  'Ateliê Carla · sobrancelhas que combinam com o seu rosto',
  'Micropigmentação e design de sobrancelhas no Setor Bueno, Goiânia. Microblading, nanoblading, shadow, lábios, delineado e o método Repigment de correção — com tabela de valores completa e agenda online.',
  'Sobrancelhas que combinam com o seu rosto — Ateliê Carla Denise',
  'Micropigmentação e design de sobrancelhas no Setor Bueno, Goiânia. +25 anos de experiência, método Repigment de correção e tabela de valores completa.',
  'https://carladenisebeauty.com.br/assets/og-atelie-carla.jpg',
  'https://carladenisebeauty.com.br/'
)
on conflict (id) do update set
  meta_title       = excluded.meta_title,
  meta_description = excluded.meta_description,
  og_title         = excluded.og_title,
  og_description   = excluded.og_description,
  og_image_url     = excluded.og_image_url,
  canonical_url    = excluded.canonical_url;

-- -------------------------------------------------------------
-- VIDEOS — um registro de exemplo, despublicado
--
-- Fica invisível no site (publicado = false) até a Carla colar a
-- URL do vídeo real e marcar como publicado no painel.
-- -------------------------------------------------------------

insert into public.videos (titulo, descricao, url, thumbnail_url, ordem, publicado)
select
  'Como funciona o Método Repigment',
  'Explicação do protocolo de correção de micropigmentações antigas, saturadas ou acinzentadas.',
  '',
  null,
  1,
  false
where not exists (
  select 1 from public.videos where titulo = 'Como funciona o Método Repigment'
);

-- -------------------------------------------------------------
-- MIDIAS — nada inserido de propósito
--
-- As fotos ainda não foram feitas. Enquanto a tabela estiver
-- vazia, o site mantém os retângulos pastel que já existem.
-- Ver dados/README.md para as dimensões de cada slot.
-- -------------------------------------------------------------

-- -------------------------------------------------------------
-- Conferência
-- -------------------------------------------------------------

do $$
declare
  n_hero   int;
  n_seo    int;
  n_videos int;
begin
  select count(*) into n_hero   from public.hero;
  select count(*) into n_seo    from public.seo;
  select count(*) into n_videos from public.videos;

  raise notice 'hero: % linha(s) | seo: % linha(s) | videos: % linha(s)', n_hero, n_seo, n_videos;

  if n_hero <> 1 or n_seo <> 1 then
    raise exception 'hero e seo deveriam ter exatamente 1 linha cada';
  end if;
end $$;
