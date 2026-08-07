-- =============================================================
-- Correção: tabela "hero" aparecendo vazia
--
-- Sintoma: a aba Abertura do painel abre com os campos em branco,
-- e a API pública devolve [] para /rest/v1/hero — enquanto /seo,
-- que tem a mesma configuração, devolve a linha normalmente.
--
-- Só existem duas causas possíveis, e este arquivo cobre as duas:
--   1. a linha não foi inserida (o seed rodou pela metade)
--   2. a linha existe, mas a política de leitura pública não
--
-- Cole tudo no SQL Editor e clique em Run. Pode rodar quantas
-- vezes quiser — não duplica nada.
--
-- ⚠️ No SQL Editor do Supabase, se houver texto SELECIONADO ele
--    executa só a seleção. Clique numa linha vazia antes de dar
--    Run para garantir que o arquivo inteiro rode — foi a causa
--    mais provável do seed ter pego só metade.
-- =============================================================

-- -------------------------------------------------------------
-- 1. Garante a linha
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
-- 2. Garante a segurança e as políticas
-- -------------------------------------------------------------

alter table public.hero enable row level security;

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

-- -------------------------------------------------------------
-- 3. Confere e mostra o resultado
-- -------------------------------------------------------------

select
  (select count(*) from public.hero)  as linhas_no_hero,
  (select count(*) from pg_policies
    where schemaname = 'public' and tablename = 'hero') as politicas_no_hero;

-- Esperado: linhas_no_hero = 1 e politicas_no_hero = 2
