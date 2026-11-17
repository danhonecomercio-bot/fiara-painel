#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
db="fiara_verify"

sudo -u postgres psql -v ON_ERROR_STOP=1 -c "drop database if exists ${db};"
sudo -u postgres psql -v ON_ERROR_STOP=1 -c "create database ${db};"
sudo -u postgres psql -v ON_ERROR_STOP=1 -d "$db" -f "$root/supabase/migrations/20261116140645_create_offer_swipe_file.sql"
sudo -u postgres psql -v ON_ERROR_STOP=1 -d "$db" -f "$root/supabase/seed.sql"
sudo -u postgres psql -v ON_ERROR_STOP=1 -d "$db" -f "$root/supabase/migrations/20261116183000_opportunity_score_google_library_actions.sql"
sudo -u postgres psql -v ON_ERROR_STOP=1 -d "$db" -f "$root/supabase/migrations/20261117020000_language_scan_and_actions.sql"

sudo -u postgres psql -v ON_ERROR_STOP=1 -d "$db" <<'SQL'
set role authenticated;

do $$
declare
  total int;
  previous int;
begin
  if (select count(*) from public.offer_cards) <> 3 then
    raise exception 'esperava 3 ofertas de exemplo';
  end if;

  select total_active_ads, prev_total_active_ads
    into total, previous
  from public.offer_cards
  where slug = 'exemplo-protocolo-queima-21';
  if total <> 546 or previous <> 466 then
    raise exception 'queima: % / %', total, previous;
  end if;

  if (select opportunity_score from public.offer_cards where slug = 'exemplo-protocolo-queima-21') <> 5 then
    raise exception 'queima sem nota 5';
  end if;
  if (select opportunity_score from public.offer_cards where slug = 'exemplo-reconquista-14-dias') is not null then
    raise exception 'reconquista deveria seguir sem nota';
  end if;

  select total_active_ads, prev_total_active_ads
    into total, previous
  from public.offer_cards
  where slug = 'exemplo-reserva-blindada';
  if total <> 248 or previous <> 138 then
    raise exception 'reserva: % / %', total, previous;
  end if;

  select total_active_ads, prev_total_active_ads
    into total, previous
  from public.offer_cards
  where slug = 'exemplo-reconquista-14-dias';
  if total <> 86 or previous <> 101 then
    raise exception 'reconquista: % / %', total, previous;
  end if;

  begin
    insert into public.offers (slug, title) values ('nao-pode', 'x');
    raise exception 'authenticated conseguiu inserir';
  exception
    when insufficient_privilege then
      null;
  end;
end
$$;
SQL

set +e
sudo -u postgres psql -v ON_ERROR_STOP=1 -d "$db" -c "set role anon; select count(*) from public.offers;" >/tmp/fiara-anon.out 2>&1
anon_status=$?
set -e
if [[ "$anon_status" -eq 0 ]]; then
  echo "anon conseguiu ler offers" >&2
  cat /tmp/fiara-anon.out >&2
  exit 1
fi

sudo -u postgres psql -v ON_ERROR_STOP=1 -d "$db" <<'SQL'
set role service_role;
insert into public.offers (slug, title) values ('escrita-service', 'ok');
delete from public.offers where slug = 'escrita-service';
SQL

echo "SQL ok: RLS, view e seed de exemplo conferidos."
