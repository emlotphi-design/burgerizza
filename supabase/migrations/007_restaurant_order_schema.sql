-- ═══════════════════════════════════════════════════════════════
--  Burgerizza — Step 7: restaurant_mode order schema
--
--  CHANGES:
--    1. Adds 'waiting_confirmation' to the status constraint so
--       restaurant mode orders can sit in the Orders dashboard
--       before staff explicitly sends them to the kitchen.
--    2. Adds source / order_type / table_number columns with safe
--       defaults so existing rows are unaffected.
--
--  HOW TO RUN (choose one):
--    a) Supabase CLI  →  npx supabase db push
--    b) Dashboard     →  SQL Editor → New query → paste → Run
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Widen the status constraint ────────────────────────────
alter table public.orders
  drop constraint if exists orders_status_check;

alter table public.orders
  add constraint orders_status_check check (
    status in (
      'waiting_confirmation',   -- restaurant mode: placed, not yet sent to kitchen
      'pending',
      'confirmed',
      'preparing',
      'ready',
      'delivered',
      'cancelled'
    )
  );

-- ── 2. Restaurant mode tracking columns ───────────────────────
alter table public.orders
  add column if not exists source       text not null default '',
  add column if not exists order_type   text not null default '',
  add column if not exists table_number text not null default '';

comment on column public.orders.source is
  'Origin: empty = customer website, ''restaurant_mode'' = in-store.';

comment on column public.orders.order_type is
  'In-store type: walk_in | pickup | dine_in. Empty for website orders.';

comment on column public.orders.table_number is
  'Table number for dine_in restaurant orders. Empty otherwise.';
