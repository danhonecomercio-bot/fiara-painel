-- Swipe file de ofertas mineradas da Biblioteca de Anúncios.
-- Leitura: usuários autenticados. Escrita: somente service role (a API ignora RLS).

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin noinherit bypassrls;
  end if;
end
$$;

grant usage on schema public to anon, authenticated, service_role;

create type public.opportunity_level as enum (
  'alta',
  'media',
  'baixa',
  'nenhuma',
  'nao_avaliada'
);

create type public.funnel_model as enum (
  'Quiz',
  'LP',
  'Quiz+LP',
  'Quiz+VSL',
  'VSL'
);

create type public.offer_status as enum ('active', 'paused');

create table public.offers (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  title text not null,
  niche text,
  language_country text,
  opportunity public.opportunity_level not null default 'nao_avaliada',
  opportunity_notes text,
  expert boolean not null default false,
  promise text,
  front_ticket text,
  funnel_model public.funnel_model,
  running_since date,
  destination_urls text[] not null default '{}',
  checkout_url text,
  order_bumps jsonb not null default '[]'::jsonb,
  upsells jsonb not null default '[]'::jsonb,
  modeling_notes text,
  raw jsonb,
  status public.offer_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint offers_slug_unique unique (slug),
  constraint offers_slug_shape check (slug ~ '^[^\s/]+$' and char_length(slug) <= 160),
  constraint offers_order_bumps_array check (jsonb_typeof(order_bumps) = 'array'),
  constraint offers_upsells_array check (jsonb_typeof(upsells) = 'array'),
  constraint offers_raw_object check (raw is null or jsonb_typeof(raw) = 'object')
);

comment on table public.offers is
  'Ofertas mineradas. slug é a chave estável do upsert dos bots.';

create table public.offer_libraries (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.offers (id) on delete cascade,
  page_name text not null,
  library_url text not null,
  active_ads integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint offer_libraries_offer_url_unique unique (offer_id, library_url),
  constraint offer_libraries_active_ads_nonnegative check (active_ads >= 0)
);

comment on table public.offer_libraries is
  'Uma linha por página/biblioteca do Facebook vinculada à oferta.';

create table public.offer_snapshots (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.offers (id) on delete cascade,
  captured_at timestamptz not null default now(),
  total_active_ads integer not null,
  per_library jsonb not null default '[]'::jsonb,
  constraint offer_snapshots_total_nonnegative check (total_active_ads >= 0),
  constraint offer_snapshots_per_library_array check (jsonb_typeof(per_library) = 'array')
);

comment on table public.offer_snapshots is
  'Append-only. Os bots gravam uma linha a cada mineração (7h e 22h, America/Sao_Paulo).';

create index offers_niche_idx on public.offers (niche);
create index offers_language_country_idx on public.offers (language_country);
create index offers_opportunity_idx on public.offers (opportunity);
create index offers_updated_at_idx on public.offers (updated_at desc);
create index offer_libraries_offer_id_idx on public.offer_libraries (offer_id);
create index offer_snapshots_offer_captured_idx
  on public.offer_snapshots (offer_id, captured_at desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;

create trigger offers_touch_updated_at
before update on public.offers
for each row execute function public.touch_updated_at();

create trigger offer_libraries_touch_updated_at
before update on public.offer_libraries
for each row execute function public.touch_updated_at();

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
  coalesce(libs.library_names, '{}'::text[]) as library_names
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
  'Lista do painel com a última leitura e a anterior. security_invoker respeita a RLS das tabelas.';

alter table public.offers enable row level security;
alter table public.offers force row level security;
alter table public.offer_libraries enable row level security;
alter table public.offer_libraries force row level security;
alter table public.offer_snapshots enable row level security;
alter table public.offer_snapshots force row level security;

create policy offers_select_authenticated
  on public.offers
  for select
  to authenticated
  using (true);

create policy offer_libraries_select_authenticated
  on public.offer_libraries
  for select
  to authenticated
  using (true);

create policy offer_snapshots_select_authenticated
  on public.offer_snapshots
  for select
  to authenticated
  using (true);

revoke all on table public.offers from public, anon, authenticated;
revoke all on table public.offer_libraries from public, anon, authenticated;
revoke all on table public.offer_snapshots from public, anon, authenticated;
revoke all on table public.offer_cards from public, anon, authenticated;

grant select on table public.offers to authenticated;
grant select on table public.offer_libraries to authenticated;
grant select on table public.offer_snapshots to authenticated;
grant select on table public.offer_cards to authenticated;

grant select, insert, update, delete on table public.offers to service_role;
grant select, insert, update, delete on table public.offer_libraries to service_role;
grant select, insert, update, delete on table public.offer_snapshots to service_role;
grant select on table public.offer_cards to service_role;
