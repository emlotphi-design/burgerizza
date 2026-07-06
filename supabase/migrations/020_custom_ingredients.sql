/*
  Migration 020 — custom_ingredients (create + realtime + storage)

  Backs the new admin "Add Ingredient" flow (replaces the old "No Asset"
  placeholder cards in src/admin/pages/Ingredients.jsx). Admins can now
  create brand-new ingredients with an uploaded image, which are merged at
  render time into the existing hardcoded PIZZA_INGREDIENTS/BURGER_* catalogs
  — this table only holds the additive, admin-created rows, so nothing about
  the existing static catalogs changes.

  category determines which builder(s) an ingredient appears in:
    dough                         -> Pizza only
    bun                           -> Burger only
    sauce/cheese/meat/vegetable   -> Pizza + Burger

  price/calories/weight_g here are the values shown at creation time. The
  live, editable price/nutrition source of truth stays ingredient_config /
  nutrition_config (migrations 016/017) exactly like every existing
  ingredient — the admin modal upserts into those tables immediately after
  inserting here, so this table is not re-read for pricing after creation.

  Modeled directly on 019_pizza_size_config.sql's table/RLS/realtime/grants
  conventions.
*/


-- ── 1. Table ──────────────────────────────────────────────────────────────────

create table if not exists public.custom_ingredients (
  id          text            primary key,
  name        text            not null,
  category    text            not null,
  price       numeric(10, 2)  not null default 0 check (price >= 0),
  calories    numeric(6, 1)   not null default 0 check (calories >= 0),
  weight_g    numeric(6, 1),
  image_url   text            not null,
  enabled     boolean         not null default true,
  created_at  timestamptz     not null default now(),

  constraint custom_ingredients_category check (
    category in ('dough', 'sauce', 'cheese', 'meat', 'vegetable', 'bun')
  )
);


-- ── 2. Row Level Security ─────────────────────────────────────────────────────

alter table public.custom_ingredients enable row level security;

-- Customer builders (anonymous) need to read newly-created ingredients
drop policy if exists "custom_ingredients: public read" on public.custom_ingredients;
create policy "custom_ingredients: public read"
  on public.custom_ingredients for select
  using (true);

-- Only admin / staff may write
drop policy if exists "custom_ingredients: admin write" on public.custom_ingredients;
create policy "custom_ingredients: admin write"
  on public.custom_ingredients for all
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


-- ── 3. Table-level grants ─────────────────────────────────────────────────────

grant select on public.custom_ingredients to anon;
grant select, insert, update, delete on public.custom_ingredients to authenticated;


-- ── 4. Supabase Realtime ──────────────────────────────────────────────────────

alter table public.custom_ingredients replica identity full;

do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname    = 'supabase_realtime'
      and schemaname = 'public'
      and tablename  = 'custom_ingredients'
  ) then
    execute 'alter publication supabase_realtime add table public.custom_ingredients';
  end if;
end $$;


-- ── 5. Storage bucket for uploaded ingredient images ──────────────────────────

insert into storage.buckets (id, name, public)
values ('ingredient-images', 'ingredient-images', true)
on conflict (id) do nothing;

drop policy if exists "ingredient-images: public read" on storage.objects;
create policy "ingredient-images: public read"
  on storage.objects for select
  using (bucket_id = 'ingredient-images');

drop policy if exists "ingredient-images: admin write" on storage.objects;
create policy "ingredient-images: admin write"
  on storage.objects for insert
  with check (
    bucket_id = 'ingredient-images'
    and exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('admin', 'staff')
    )
  );
