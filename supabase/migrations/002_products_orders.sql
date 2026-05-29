-- ═══════════════════════════════════════════════════════════════
--  Burgerizza — Step 3: products, orders tables + admin RLS
--
--  HOW TO RUN:
--    1. Open your Supabase project dashboard
--    2. Go to  SQL Editor → New query
--    3. Paste this entire file and click Run
-- ═══════════════════════════════════════════════════════════════


-- ── 1. is_admin() helper — security definer so it bypasses RLS ─
--       Used in policies below to avoid recursion.
-- ──────────────────────────────────────────────────────────────
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;


-- ── 2. Widen profiles SELECT policy so admins can list all users
-- ──────────────────────────────────────────────────────────────
drop policy if exists "profiles: select own or admin" on public.profiles;
create policy "profiles: select own or admin"
  on public.profiles
  for select
  using (auth.uid() = id or public.is_admin());

-- Drop the narrower policy from migration 001 if it still exists
drop policy if exists "profiles: select own" on public.profiles;


-- ── 3. products table ─────────────────────────────────────────
create table if not exists public.products (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  description text        not null default '',
  price       numeric(10,2) not null check (price >= 0),
  category    text        not null default 'other',
  emoji       text        not null default '🍔',
  active      boolean     not null default true,
  sort_order  int         not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.products is 'Menu items sold in the Burgerizza store.';

alter table public.products enable row level security;

-- Anyone (even guests) can read active products
drop policy if exists "products: public read active" on public.products;
create policy "products: public read active"
  on public.products
  for select
  using (active = true or public.is_admin());

-- Only admins can insert / update / delete
drop policy if exists "products: admin write" on public.products;
create policy "products: admin write"
  on public.products
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- Auto-update updated_at on row change
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at
  before update on public.products
  for each row execute procedure public.set_updated_at();


-- ── 4. orders table ───────────────────────────────────────────
create table if not exists public.orders (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        references auth.users(id) on delete set null,
  customer_name    text        not null default '',
  customer_email   text        not null default '',
  customer_phone   text        not null default '',
  delivery_address jsonb       not null default '{}',
  items            jsonb       not null default '[]',
  total_price      numeric(10,2) not null check (total_price >= 0),
  status           text        not null default 'pending',
  payment_method   text        not null default 'cash',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint orders_status_check check (
    status in ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')
  )
);

comment on table public.orders is 'Customer orders. items is a JSONB snapshot of cart contents at order time.';

alter table public.orders enable row level security;

-- Guests and logged-in users can place orders
drop policy if exists "orders: insert for all" on public.orders;
create policy "orders: insert for all"
  on public.orders
  for insert
  with check (true);

-- Users can read their own orders; admins can read all
drop policy if exists "orders: select own or admin" on public.orders;
create policy "orders: select own or admin"
  on public.orders
  for select
  using (auth.uid() = user_id or public.is_admin());

-- Only admins can update / delete
drop policy if exists "orders: admin update" on public.orders;
create policy "orders: admin update"
  on public.orders
  for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "orders: admin delete" on public.orders;
create policy "orders: admin delete"
  on public.orders
  for delete
  using (public.is_admin());

-- Auto-update updated_at
drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at
  before update on public.orders
  for each row execute procedure public.set_updated_at();


-- ── 5. Enable Realtime on orders ──────────────────────────────
alter publication supabase_realtime add table public.orders;


-- ── 6. Seed: starter product catalogue ───────────────────────
insert into public.products (name, description, price, category, emoji, sort_order) values
  ('Classic Burger',      'Beef patty, lettuce, tomato, pickles',          8.99,  'burger', '🍔', 10),
  ('Double Smash',        'Two smashed beef patties, caramelised onions',  11.99, 'burger', '🍔', 20),
  ('BBQ Bacon Burger',    'Beef, crispy bacon, BBQ sauce, cheddar',        12.99, 'burger', '🍔', 30),
  ('Veggie Burger',       'Plant-based patty, avocado, fresh salad',       10.99, 'burger', '🥗', 40),
  ('Margherita Pizza',    'Tomato, mozzarella, basil',                     9.99,  'pizza',  '🍕', 50),
  ('Pepperoni Pizza',     'Tomato, mozzarella, pepperoni',                 11.99, 'pizza',  '🍕', 60),
  ('BBQ Chicken Pizza',   'BBQ base, chicken, red onion, mozzarella',      13.99, 'pizza',  '🍕', 70),
  ('Four Cheese Pizza',   'Mozzarella, cheddar, parmesan, gorgonzola',     12.99, 'pizza',  '🍕', 80),
  ('Classic Fries',       'Golden salted fries',                           3.49,  'sides',  '🍟', 90),
  ('Onion Rings',         'Crispy beer-battered onion rings',              3.99,  'sides',  '🧅', 100),
  ('Chocolate Shake',     'Rich Belgian chocolate milkshake',              4.99,  'drinks', '🥤', 110),
  ('Vanilla Shake',       'Creamy classic vanilla milkshake',              4.99,  'drinks', '🥤', 120)
on conflict do nothing;
