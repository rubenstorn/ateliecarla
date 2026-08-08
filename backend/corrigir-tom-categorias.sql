-- =============================================================
-- Correção: tons de categoria fora de sincronia com o site
--
-- Sintoma: uma categoria salva no painel com o tom "verde" ou
-- "dourado" aparece no site sem a cor pastel de fundo (o cartão
-- fica com a caixa de imagem em branco/quebrada).
--
-- Causa: o site (index.css) só define cor para 5 tons — rosa,
-- lilas, azul, pink, ambar. A restrição da coluna "tom" nesta
-- tabela (e o seletor do painel) foi criada com "verde" e
-- "dourado" no lugar de "pink" e "ambar", então o painel deixa
-- escolher tons que o site não sabe desenhar.
--
-- Cole tudo no SQL Editor e clique em Run. Pode rodar quantas
-- vezes quiser — não duplica nada.
--
-- ⚠️ No SQL Editor do Supabase, se houver texto SELECIONADO ele
--    executa só a seleção. Clique numa linha vazia antes de dar
--    Run para garantir que o arquivo inteiro rode.
-- =============================================================

-- -------------------------------------------------------------
-- 1. Converte linhas existentes que estejam com o tom antigo
--    (não deveria haver nenhuma ainda, mas por segurança)
-- -------------------------------------------------------------

update public.catalogo_categorias set tom = 'pink'  where tom = 'verde';
update public.catalogo_categorias set tom = 'ambar' where tom = 'dourado';

-- -------------------------------------------------------------
-- 2. Troca a restrição da coluna para os tons que o site desenha
-- -------------------------------------------------------------

alter table public.catalogo_categorias
  drop constraint if exists catalogo_categorias_tom_check;

alter table public.catalogo_categorias
  add constraint catalogo_categorias_tom_check
  check (tom in ('rosa', 'lilas', 'azul', 'pink', 'ambar'));

-- -------------------------------------------------------------
-- 3. Confere o resultado
-- -------------------------------------------------------------

select id, titulo, tom from public.catalogo_categorias order by ordem, titulo;

-- Esperado: nenhuma linha com tom "verde" ou "dourado".
