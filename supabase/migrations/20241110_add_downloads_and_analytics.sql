-- Add downloads table
create table if not exists downloads (
  id uuid primary key default gen_random_uuid(),
  ts timestamptz default now()
);

-- RPC function to get page visits count
create or replace function get_page_visits()
returns jsonb
language sql
as $$
  select jsonb_object_agg(page, count(*)::int)
  from ad_visits
  where page between 1 and 4;
$$;

-- RPC function to get ad clicks count
create or replace function get_ad_clicks()
returns jsonb
language sql
as $$
  select jsonb_object_agg(ad_id, count(*)::int)
  from ad_clicks;
$$;

-- RPC function to get total downloads
create or replace function get_total_downloads()
returns int
language sql
as $$
  select count(*) from downloads;
$$;

-- Grant execute permissions
grant execute on function get_page_visits() to anon, authenticated;
grant execute on function get_ad_clicks() to anon, authenticated;
grant execute on function get_total_downloads() to anon, authenticated;
