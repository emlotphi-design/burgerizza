/*
  Migration 017 — nutrition_config (create + realtime)

  Adds admin-editable, real-time-synced nutrition data (weight/calories,
  protein/carbs/fat reserved for later) for pizza builder ingredients,
  burger builder ingredients, and prepared menu items (desserts/drinks/
  quick-order burger & pizza items).

  This is a NEW, ISOLATED table — modeled directly on
  016_ingredient_realtime.sql's ingredient_config table/RLS/realtime setup,
  but kept completely separate from it. ingredient_config (price/enabled)
  is not touched by this migration, so existing pricing sync is unaffected.

  Also adds nullable nutrition columns to the existing `products` table so
  the admin Products page can hold weight/calories per product.
*/


-- ── 1. Table ──────────────────────────────────────────────────────────────────

create table if not exists public.nutrition_config (
  id          text            not null,
  scope       text            not null,
  weight_g    numeric(6, 1),
  calories    numeric(6, 1)   not null default 0 check (calories >= 0),
  protein_g   numeric(6, 2),
  carbs_g     numeric(6, 2),
  fat_g       numeric(6, 2),
  updated_at  timestamptz     not null default now(),

  constraint nutrition_config_pkey  primary key (id, scope),
  constraint nutrition_config_scope check (scope in ('pizza', 'burger', 'menu'))
);


-- ── 2. Row Level Security ─────────────────────────────────────────────────────

alter table public.nutrition_config enable row level security;

-- Customer builders (anonymous) need live nutrition data
drop policy if exists "nutrition_config: public read" on public.nutrition_config;
create policy "nutrition_config: public read"
  on public.nutrition_config for select
  using (true);

-- Only admin / staff may write
drop policy if exists "nutrition_config: admin write" on public.nutrition_config;
create policy "nutrition_config: admin write"
  on public.nutrition_config for all
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

create or replace function public.set_nutrition_config_timestamp()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists nutrition_config_updated_at on public.nutrition_config;
create trigger nutrition_config_updated_at
  before update on public.nutrition_config
  for each row execute function public.set_nutrition_config_timestamp();


-- ── 4. Table-level grants ─────────────────────────────────────────────────────

grant select on public.nutrition_config to anon;
grant select, insert, update, delete on public.nutrition_config to authenticated;


-- ── 5. Supabase Realtime ──────────────────────────────────────────────────────

alter table public.nutrition_config replica identity full;

do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname    = 'supabase_realtime'
      and schemaname = 'public'
      and tablename  = 'nutrition_config'
  ) then
    execute 'alter publication supabase_realtime add table public.nutrition_config';
  end if;
end $$;


-- ── 6. Nutrition columns on products (admin Products page only) ───────────────

alter table public.products add column if not exists weight_g numeric(6, 1);
alter table public.products add column if not exists calories numeric(6, 1);
