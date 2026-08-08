-- =============================================================
-- Aviso por e-mail quando chega um contato novo pelo site
--
-- O que este script faz: toda vez que alguém envia o formulário
-- de contato, o banco chama a Edge Function "notificar-lead"
-- (backend/supabase/functions/notificar-lead), que manda um
-- e-mail para carlamaquiagem1980@gmail.com com os dados do
-- contato.
--
-- PRÉ-REQUISITOS antes de rodar este arquivo:
--   1. Publique a Edge Function "notificar-lead" (peça pro
--      Claude fazer isso, ou rode via CLI do Supabase).
--   2. Crie uma conta grátis em resend.com e gere uma API key.
--   3. Em Project Settings › Edge Functions › Secrets, adicione:
--        RESEND_API_KEY = <a chave do Resend>
--        WEBHOOK_SECRET = <uma senha aleatória seguida por você>
--   4. Troque SEGREDO_AQUI abaixo pelo MESMO valor que você
--      colocou em WEBHOOK_SECRET no passo 3.
--
-- Cole tudo no SQL Editor do Supabase e clique em Run.
-- =============================================================

create extension if not exists pg_net with schema extensions;

create or replace function public.leads_notificar()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform net.http_post(
    url := 'https://bnnhwefceiegsaklvtec.supabase.co/functions/v1/notificar-lead',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', 'SEGREDO_AQUI'
    ),
    body := jsonb_build_object('record', to_jsonb(new))
  );
  return new;
end;
$$;

drop trigger if exists leads_notificar on public.leads;
create trigger leads_notificar
  after insert on public.leads
  for each row execute function public.leads_notificar();

-- Confere se o gatilho ficou de pé
select tgname from pg_trigger where tgname = 'leads_notificar';

-- Esperado: uma linha com "leads_notificar".
