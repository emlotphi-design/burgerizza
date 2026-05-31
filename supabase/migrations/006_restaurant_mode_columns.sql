-- ═══════════════════════════════════════════════════════════════
--  Burgerizza — Step 6: restaurant_mode tracking columns
--
--  WHY: The admin "Restaurant Mode" creates in-store walk-in
--       orders that need to be distinguished from customer
--       website orders, and tagged with the in-store order type
--       (walk_in / pickup / dine_in).
--
--  HOW TO RUN (choose one):
--    a) Supabase CLI  →  npx supabase db push
--    b) Dashboard     →  SQL Editor → New query → paste → Run
-- ═══════════════════════════════════════════════════════════════

alter table public.orders
  add column if not exists source     text not null default '',
  add column if not exists order_type text not null default '';

comment on column public.orders.source is
  'Origin of the order. Empty = customer website. ''restaurant_mode'' = in-store POS.';

comment on column public.orders.order_type is
  'In-store mode: walk_in | pickup | dine_in. Empty string for normal delivery orders.';
