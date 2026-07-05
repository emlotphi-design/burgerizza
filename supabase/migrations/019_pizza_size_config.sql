/*
  Migration 019 — pizza_size_config (create + realtime)

  Makes pizza size (26/33/40cm) a fully database-driven, per-dough
  configuration instead of a flat, dough-agnostic list. Every (dough, size)
  combination gets its own enabled flag, price surcharge, calories, weight,
  and sort order — e.g. Käserand and Würstchenrand can each offer a
  different subset of sizes, at different prices, from Classic Thin Crust.

  Modeled directly on 016_ingredient_realtime.sql / 017_nutrition_config.sql's
  table/RLS/realtime conventions, kept as its own isolated table.

  `price` here is a SURCHARGE added on top of the dough's base price and
  toppings (see src/utils/pizzaPriceUtils.js) — not a full price override.
  It defaults to 0 for every seeded row, so this migration does not change
  any customer-facing price until an admin explicitly sets a surcharge.

  The old nutrition_config rows for scope='pizza', id in ('26','33','40')
  (added in migration 017) are left untouched but are superseded by this
  table going forward — size weight/calories are now read per-dough from
  here instead of from that flat, shared-across-doughs row.
*/


-- ── 1. Table ──────────────────────────────────────────────────────────────────

create table if not exists public.pizza_size_config (
  dough       text            not null,
  size        text            not null,
  enabled     boolean         not null default true,
  price       numeric(10, 2)  not null default 0 check (price >= 0),
  calories    numeric(6, 1)   not null default 0 check (calories >= 0),
  weight_g    numeric(6, 1),
  sort_order  int             not null default 0,
  updated_at  timestamptz     not null default now(),

  constraint pizza_size_config_pkey  primary key (dough, size),
  constraint pizza_size_config_dough check (dough in ('american', 'americanp', 'thin')),
  constraint pizza_size_config_size  check (size in ('26', '33', '40'))
);


-- ── 2. Row Level Security ─────────────────────────────────────────────────────

alter table public.pizza_size_config enable row level security;

-- Customer builder (anonymous) needs live size availability/price/nutrition
drop policy if exists "pizza_size_config: public read" on public.pizza_size_config;
create policy "pizza_size_config: public read"
  on public.pizza_size_config for select
  using (true);

-- Only admin / staff may write
drop policy if exists "pizza_size_config: admin write" on public.pizza_size_config;
create policy "pizza_size_config: admin write"
  on public.pizza_size_config for all
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

create or replace function public.set_pizza_size_config_timestamp()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists pizza_size_config_updated_at on public.pizza_size_config;
create trigger pizza_size_config_updated_at
  before update on public.pizza_size_config
  for each row execute function public.set_pizza_size_config_timestamp();


-- ── 4. Table-level grants ─────────────────────────────────────────────────────

grant select on public.pizza_size_config to anon;
grant select, insert, update, delete on public.pizza_size_config to authenticated;


-- ── 5. Supabase Realtime ──────────────────────────────────────────────────────

alter table public.pizza_size_config replica identity full;

do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname    = 'supabase_realtime'
      and schemaname = 'public'
      and tablename  = 'pizza_size_config'
  ) then
    execute 'alter publication supabase_realtime add table public.pizza_size_config';
  end if;
end $$;


-- ── 6. Seed data ──────────────────────────────────────────────────────────────
-- Same weight/calories the flat size list already used (180/430, 260/620,
-- 380/900), applied identically across all three doughs and all enabled —
-- preserves current behavior exactly. price = 0 everywhere (no surcharge
-- until an admin sets one). sort_order matches the natural 26 < 33 < 40 order.

insert into public.pizza_size_config (dough, size, enabled, price, calories, weight_g, sort_order)
values
  ('thin',      '26', true, 0, 430, 180, 0),
  ('thin',      '33', true, 0, 620, 260, 1),
  ('thin',      '40', true, 0, 900, 380, 2),
  ('americanp', '26', true, 0, 430, 180, 0),
  ('americanp', '33', true, 0, 620, 260, 1),
  ('americanp', '40', true, 0, 900, 380, 2),
  ('american',  '26', true, 0, 430, 180, 0),
  ('american',  '33', true, 0, 620, 260, 1),
  ('american',  '40', true, 0, 900, 380, 2)
on conflict (dough, size) do nothing;
