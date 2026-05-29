-- ═══════════════════════════════════════════════════════════════
--  Burgerizza — Step 5: driver assignment columns on orders
--
--  WHY: The admin SmartPipeline assigns a driver when moving an
--       order to "on the way" (status = 'ready'). These two columns
--       were missing from the original schema, causing every
--       driver-assignment Supabase UPDATE to fail.
--
--  HOW TO RUN (choose one):
--    a) Supabase CLI  →  npx supabase db push
--    b) Dashboard     →  SQL Editor → New query → paste → Run
-- ═══════════════════════════════════════════════════════════════

alter table public.orders
  add column if not exists driver_name text not null default '',
  add column if not exists driver_id   text not null default '';

comment on column public.orders.driver_name is
  'Display name of the delivery driver assigned to this order.';
comment on column public.orders.driver_id is
  'Optional internal driver identifier for future driver accounts.';
