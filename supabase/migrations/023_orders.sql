/*
  Migration 023 — orders (missing columns)

  The `orders` table itself already exists (migration 002) and is not
  recreated here — this migration only adds the columns the current
  frontend needs that were never applied:

  - idempotency_key  (Checkout.jsx sends this on every web checkout insert;
                       its absence is what breaks checkout today)
  - subtotal, discount_amount, tax_amount (Checkout.jsx / POS.jsx / the
                       Restaurant Mode checkout all send these now)

  discount_amount/tax_amount are populated as 0 by the app for every new
  order — no discount-code or VAT computation logic exists yet, so these
  columns are schema-ready but always read 0 until that's built separately.

  Idempotent: every statement uses IF NOT EXISTS / a guarded DO block.
*/

alter table public.orders add column if not exists idempotency_key text;
alter table public.orders add column if not exists subtotal        numeric(10, 2);
alter table public.orders add column if not exists discount_amount numeric(10, 2) not null default 0;
alter table public.orders add column if not exists tax_amount      numeric(10, 2) not null default 0;

-- Unique constraint on idempotency_key (nullable + unique — Postgres treats
-- every NULL as distinct, so POS/Restaurant Mode orders that don't set it
-- are unaffected).
do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'orders_idempotency_key_unique'
  ) then
    alter table public.orders
      add constraint orders_idempotency_key_unique unique (idempotency_key);
  end if;
end $$;
