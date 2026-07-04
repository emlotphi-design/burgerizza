/*
  Migration 018 — orders.idempotency_key

  Prevents duplicate orders from double-submits, network retries, or a
  client crash-and-retry after a successful-but-unacknowledged insert.

  The customer checkout generates one random key per checkout attempt and
  sends it with the order insert. A unique constraint means a second insert
  attempt with the same key is rejected by Postgres (error 23505) instead
  of creating a second row — the client then looks up the original order
  by this key and treats it as success.

  Nullable + unique: Postgres unique constraints treat every NULL as
  distinct, so existing orders and non-customer flows (POS / Restaurant
  Mode, which don't set this column) are completely unaffected.
*/

alter table public.orders add column if not exists idempotency_key text;

do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'orders_idempotency_key_unique'
  ) then
    alter table public.orders
      add constraint orders_idempotency_key_unique unique (idempotency_key);
  end if;
end $$;
