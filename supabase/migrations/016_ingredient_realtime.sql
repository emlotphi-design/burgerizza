/*
  Migration 016 — ingredient_config (create + realtime)

  Creates the ingredient_config table from scratch and immediately enables
  Supabase Realtime on it so admin ON/OFF toggles and price changes sync
  instantly to customer builders on all devices (desktop + mobile).

  This migration supersedes 015_ingredient_config.sql.
  Run ONLY this file — do NOT run 015 separately (it will conflict).

  Safe to run on a database where 015 was already applied; every DDL
  statement uses IF NOT EXISTS / OR REPLACE / DROP IF EXISTS so nothing
  breaks if the table or its dependencies already exist.
*/


-- ── 1. Table ──────────────────────────────────────────────────────────────────

create table if not exists public.ingredient_config (
  id          text            not null,
  builder     text            not null,
  price       numeric(10, 2)  not null check (price >= 0),
  enabled     boolean         not null default true,
  updated_at  timestamptz     not null default now(),

  constraint ingredient_config_pkey    primary key (id, builder),
  constraint ingredient_config_builder check (builder in ('pizza', 'burger'))
);


-- ── 2. Row Level Security ─────────────────────────────────────────────────────

alter table public.ingredient_config enable row level security;

-- Customer builders (anonymous) need live prices and enabled states
drop policy if exists "ingredient_config: public read" on public.ingredient_config;
create policy "ingredient_config: public read"
  on public.ingredient_config for select
  using (true);

-- Only admin / staff may write
drop policy if exists "ingredient_config: admin write" on public.ingredient_config;
create policy "ingredient_config: admin write"
  on public.ingredient_config for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('admin', 'staff')
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('admin', 'staff')
    )
  );


-- ── 3. auto-update trigger ────────────────────────────────────────────────────

create or replace function public.set_ingredient_config_timestamp()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists ingredient_config_updated_at on public.ingredient_config;
create trigger ingredient_config_updated_at
  before update on public.ingredient_config
  for each row execute function public.set_ingredient_config_timestamp();


-- ── 4. Table-level grants ─────────────────────────────────────────────────────
-- Required alongside RLS policies for Supabase Realtime postgres_changes to
-- broadcast events to the anon / authenticated roles.
-- Without GRANT SELECT TO anon, anonymous mobile users receive no realtime events
-- even when the RLS policy says using (true).

grant select on public.ingredient_config to anon;
grant select, insert, update, delete on public.ingredient_config to authenticated;


-- ── 5. Supabase Realtime ──────────────────────────────────────────────────────
-- REPLICA IDENTITY FULL: include complete old-row data in UPDATE / DELETE events
-- so the realtime payload carries all columns, not just the primary key.

alter table public.ingredient_config replica identity full;

-- Add to the supabase_realtime publication (idempotent guard)
do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname    = 'supabase_realtime'
      and schemaname = 'public'
      and tablename  = 'ingredient_config'
  ) then
    execute 'alter publication supabase_realtime add table public.ingredient_config';
  end if;
end $$;
