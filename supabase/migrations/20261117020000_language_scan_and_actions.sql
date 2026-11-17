alter table public.offers
  add column if not exists language_scan jsonb;

comment on column public.offers.language_scan is
  'Resultado da varredura em idiomas: ran_at e results por es, en, fr, de, it e pt. Chave ausente = não varrida. Lista vazia = varrida, nada encontrado.';

do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'offer_actions'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%baixar_top_ads%'
  loop
    execute format('alter table public.offer_actions drop constraint %I', constraint_name);
  end loop;
end $$;

alter table public.offer_actions
  add constraint offer_actions_action_check
  check (action in ('baixar_top_ads', 'modelar', 'dissecar', 'varredura_idiomas'));
