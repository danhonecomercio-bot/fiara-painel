alter table public.offers
  add column if not exists opportunity_score smallint,
  add column if not exists google_library_url text;

alter table public.offers
  drop constraint if exists offers_opportunity_score_range;

alter table public.offers
  add constraint offers_opportunity_score_range
  check (opportunity_score is null or (opportunity_score between 0 and 5));

comment on column public.offers.opportunity_score is
  'Nota de 0 a 5. Null significa que a oferta ainda não foi avaliada.';

comment on column public.offers.google_library_url is
  'URL opcional do Google Ads Transparency Center.';

update public.offers
set opportunity_score = case opportunity::text
  when 'alta' then 5
  when 'media' then 3
  when 'baixa' then 1
  when 'nenhuma' then 0
  else null
end
where opportunity_score is null
  and opportunity::text <> 'nao_avaliada';

update public.offers
set google_library_url = 'https://adstransparency.google.com/advertiser/AR-exemplo-queima?region=BR'
where slug = 'exemplo-protocolo-queima-21'
  and google_library_url is null;

create or replace view public.offer_cards
with (security_invoker = true) as
select
  o.id,
  o.slug,
  o.title,
  o.niche,
  o.language_country,
  o.opportunity,
  o.expert,
  o.promise,
  o.front_ticket,
  o.funnel_model,
  o.status,
  o.running_since,
  o.updated_at,
  o.created_at,
  coalesce((o.raw ->> 'example')::boolean, false) as is_example,
  snap.total_active_ads,
  snap.captured_at as last_captured_at,
  snap.prev_total_active_ads,
  snap.prev_captured_at,
  coalesce(libs.library_names, '{}'::text[]) as library_names,
  o.opportunity_score
from public.offers o
left join lateral (
  select
    s.total_active_ads,
    s.captured_at,
    prev.total_active_ads as prev_total_active_ads,
    prev.captured_at as prev_captured_at
  from public.offer_snapshots s
  left join lateral (
    select p.total_active_ads, p.captured_at
    from public.offer_snapshots p
    where p.offer_id = o.id
      and (p.captured_at, p.id) < (s.captured_at, s.id)
    order by p.captured_at desc, p.id desc
    limit 1
  ) prev on true
  where s.offer_id = o.id
  order by s.captured_at desc, s.id desc
  limit 1
) snap on true
left join lateral (
  select array_agg(l.page_name order by l.page_name) as library_names
  from public.offer_libraries l
  where l.offer_id = o.id
) libs on true;

comment on view public.offer_cards is
  'Lista do painel com a última leitura, a anterior e a nota. security_invoker respeita a RLS das tabelas.';

grant select on table public.offer_cards to authenticated;
grant select on table public.offer_cards to service_role;

create table if not exists public.offer_actions (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.offers (id) on delete cascade,
  action text not null check (action in ('baixar_top_ads', 'modelar')),
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'done')),
  requested_by text not null,
  result_url text,
  error text,
  created_at timestamptz not null default pg_catalog.now()
);

create index if not exists offer_actions_offer_idx
  on public.offer_actions (offer_id, action, created_at desc);

alter table public.offer_actions enable row level security;
alter table public.offer_actions force row level security;

drop policy if exists offer_actions_select_authenticated on public.offer_actions;
create policy offer_actions_select_authenticated
  on public.offer_actions
  for select
  to authenticated
  using (true);

revoke all on table public.offer_actions from public, anon, authenticated;
grant select on table public.offer_actions to authenticated;
grant select, insert, update, delete on table public.offer_actions to service_role;
