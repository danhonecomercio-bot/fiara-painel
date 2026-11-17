drop view if exists public.offer_cards;

alter table public.offers
  alter column opportunity_score type numeric(2,1)
  using opportunity_score::numeric(2,1);

alter table public.offers
  drop constraint if exists offers_opportunity_score_range;

alter table public.offers
  add constraint offers_opportunity_score_range
  check (
    opportunity_score is null
    or (
      opportunity_score >= 0
      and opportunity_score <= 5
      and (opportunity_score * 2) = trunc(opportunity_score * 2)
    )
  );

comment on column public.offers.opportunity_score is
  'Nota de 0 a 5, de meio em meio. Null significa que a oferta ainda não foi avaliada.';

create view public.offer_cards
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
