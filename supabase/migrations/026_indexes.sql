/*
  Migration 026 — Indexes

  Secondary indexes so time-filtered Analytics queries (025_analytics.sql)
  and admin dashboard lookups stay fast as orders/inventory tables grow
  over years, instead of full table scans.

  Idempotent: every statement uses IF NOT EXISTS.
*/

create index if not exists orders_created_at_idx     on public.orders(created_at);
create index if not exists orders_status_idx         on public.orders(status);
create index if not exists orders_payment_method_idx  on public.orders(payment_method);

create index if not exists order_items_order_idx   on public.order_items(order_id);
create index if not exists order_items_created_idx  on public.order_items(created_at);
create index if not exists order_items_name_idx     on public.order_items(product_name);
create index if not exists order_items_type_idx     on public.order_items(product_type);

create index if not exists inventory_items_category_idx         on public.inventory_items(category_id);
create index if not exists inventory_items_active_idx            on public.inventory_items(is_active);
create index if not exists inventory_consumption_rules_item_idx  on public.inventory_consumption_rules(inventory_item_id);
create index if not exists purchase_receipts_item_idx            on public.purchase_receipts(inventory_item_id);
create index if not exists inventory_transactions_item_idx       on public.inventory_transactions(inventory_item_id);
create index if not exists inventory_transactions_order_idx      on public.inventory_transactions(order_id);
create index if not exists inventory_transactions_receipt_idx    on public.inventory_transactions(purchase_receipt_id);
create index if not exists inventory_transactions_created_idx    on public.inventory_transactions(created_at);
