create table if not exists ad_pages (
  id int primary key,
  config jsonb
);

create table if not exists ad_visits (
  id uuid primary key default gen_random_uuid(),
  page int,
  ts timestamptz default now()
);

create table if not exists ad_clicks (
  id uuid primary key default gen_random_uuid(),
  ad_id text,
  ts timestamptz default now()
);
-- Seed default 4 ad pages
insert into ad_pages (id, config) values
(1, '{"countdown":5,"ads":[]}'::jsonb),
(2, '{"countdown":5,"ads":[]}'::jsonb),
(3, '{"countdown":5,"ads":[]}'::jsonb),
(4, '{"countdown":5,"ads":[]}'::jsonb)
on conflict (id) do nothing;

create or replace function increment_link_clicks(p_code text)
returns void language sql as $$
  update links set clicks = coalesce(clicks,0) + 1
  where short_code = p_code;
$$;

-- Returns the original_url for a short_code (RLS-safe)
create or replace function public.resolve_short_code(p_code text)
returns text
language sql
security definer
set search_path = public
as $$
  select original_url
  from public.links
  where short_code = p_code
  limit 1;
$$;

-- Allow both anon + authenticated to call it
grant execute on function public.resolve_short_code(text) to anon, authenticated;

-- Increment clicks (you already planned this)
create or replace function public.increment_link_clicks(p_code text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.links
  set clicks = coalesce(clicks,0) + 1
  where short_code = p_code;
$$;

grant execute on function public.increment_link_clicks(text) to anon, authenticated;

-- Function to sanitize URLs on insert
create or replace function public.sanitize_link_url()
returns trigger
language plpgsql
as $$
begin
  if new.original_url is not null and new.original_url <> '' then
    if new.original_url not ilike 'http%' then
      new.original_url := 'https://' || new.original_url;
    end if;
  end if;
  return new;
end;
$$;

-- Trigger: runs before every insert into links table
drop trigger if exists trg_sanitize_link_url on public.links;
create trigger trg_sanitize_link_url
before insert or update on public.links
for each row execute function public.sanitize_link_url();

