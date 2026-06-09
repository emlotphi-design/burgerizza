/*
  Migration 015 — ingredient_config

  Stores admin-configured prices and enabled/disabled states for
  pizza and burger builder ingredients.

  The ingredient catalog (names, categories, visual assets) lives in
  static JS files — this table only holds the mutable runtime config
  that admins can change via /admin/ingredients.

  Primary key (id, builder) because the same ingredient ID can exist
  in both builders (e.g. 'mushroom', 'bacon', 'chicken').
*/

create table if not exists public.ingredient_config (
  id          text          not null,
  builder     text          not null,
  price       numeric(10,2) not null check (price >= 0),
  enabled     boolean       not null default true,
  updated_at  timestamptz   not null default now(),
  constraint ingredient_config_pkey     primary key (id, builder),
  constraint ingredient_config_builder  check (builder in ('pizza', 'burger'))
);

alter table public.ingredient_config enable row level security;

-- Customer-facing builders need live prices — allow anonymous read.
create policy "ingredient_config: public read"
  on public.ingredient_config for select
  using (true);

-- Only admin / staff can write.
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

create or replace function public.set_ingredient_config_timestamp()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger ingredient_config_updated_at
  before update on public.ingredient_config
  for each row execute function public.set_ingredient_config_timestamp();

-- Full row snapshots in realtime payloads (required for UPDATE/DELETE events)
alter table public.ingredient_config replica identity full;

-- Publish to Supabase Realtime so builders receive live ingredient changes
alter publication supabase_realtime add table public.ingredient_config;

-- Table-level grants (required alongside RLS policies for Supabase Realtime and
-- direct queries to work for the anon / authenticated roles)
-- anon: customer builders + realtime subscriptions (unauthenticated mobile users)
-- authenticated: admin/staff writes; SELECT included so the fetch on mount works
grant select on public.ingredient_config to anon;
grant select, insert, update, delete on public.ingredient_config to authenticated;
