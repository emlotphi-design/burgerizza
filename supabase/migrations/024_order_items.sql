/*
  Migration 024 — order_items (normalized order line items)

  orders.items is a jsonb cart snapshot with different shapes for pizza vs
  burger vs plain menu items — fine for storing an order, expensive to
  aggregate over (Best Selling Products/Categories, sales-by-day, etc.)
  once there are years of orders. This table normalizes every line into a
  flat, indexed row, populated automatically by an AFTER INSERT trigger on
  `orders` — no frontend change needed, since Checkout.jsx / POS.jsx /
  RestaurantCheckout all already write `items` the same way they do today.

  Every item across all three insert sites carries `name`, `type`
  ('pizza' | 'burger' | 'menu'), a per-unit `price`, and a `quantity` —
  confirmed against the actual code, not assumed.

  Idempotent: safe to run multiple times.
*/


-- ── 1. Table ──────────────────────────────────────────────────────────────────

create table if not exists public.order_items (
  id            uuid            primary key default gen_random_uuid(),
  order_id      uuid            not null references public.orders(id) on delete cascade,
  product_name  text            not null,
  product_type  text            not null default '',
  quantity      numeric(10, 2)  not null default 1,
  unit_price    numeric(10, 2)  not null default 0,
  line_total    numeric(10, 2)  not null default 0,
  created_at    timestamptz     not null default now()
);


-- ── 2. Row Level Security ─────────────────────────────────────────────────────

alter table public.order_items enable row level security;

drop policy if exists "order_items: select own or admin" on public.order_items;
create policy "order_items: select own or admin"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())
    )
  );

grant select on public.order_items to authenticated;


-- ── 3. Auto-populate trigger ──────────────────────────────────────────────────

create or replace function public.populate_order_items()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item jsonb;
begin
  for v_item in select * from jsonb_array_elements(coalesce(NEW.items, '[]'::jsonb))
  loop
    insert into public.order_items (order_id, product_name, product_type, quantity, unit_price, line_total, created_at)
    values (
      NEW.id,
      coalesce(nullif(v_item->>'name', ''), 'Unknown Item'),
      coalesce(v_item->>'type', ''),
      coalesce((v_item->>'quantity')::numeric, 1),
      coalesce((v_item->>'price')::numeric, 0),
      coalesce((v_item->>'quantity')::numeric, 1) * coalesce((v_item->>'price')::numeric, 0),
      NEW.created_at
    );
  end loop;
  return NEW;
end;
$$;

drop trigger if exists orders_populate_order_items on public.orders;
create trigger orders_populate_order_items
  after insert on public.orders
  for each row execute function public.populate_order_items();
