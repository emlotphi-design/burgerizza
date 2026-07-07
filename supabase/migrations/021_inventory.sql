/*
  Migration 021 — Inventory (tables + functions + triggers)

  Consolidated, idempotent rewrite. Nothing here has ever been applied to
  the live database (confirmed via live schema probing), so this file is
  the single source of truth for Inventory going forward — it supersedes
  and replaces the old 021_inventory.sql / 022_inventory_recategorize.sql /
  023_inventory_category_names.sql three-step history.

  Column names match src/admin/pages/Inventory.jsx and
  src/admin/services/adminService.js EXACTLY (category_id, current_stock,
  minimum_stock, maximum_stock, purchase_price, last_purchase_date,
  image_url, is_active, ...) — the frontend is not being modified, so the
  schema must match it, not the other way around.

  Safe to run multiple times: every statement uses IF NOT EXISTS / OR
  REPLACE / DROP POLICY IF EXISTS / ON CONFLICT DO NOTHING.
*/


-- ═══════════════════════════════════════════════════════════════════════════
-- 1. Tables
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.inventory_categories (
  id          uuid            primary key default gen_random_uuid(),
  name        text            not null unique,
  sort_order  int             not null default 0,
  created_at  timestamptz     not null default now()
);

create table if not exists public.inventory_items (
  id                  uuid            primary key default gen_random_uuid(),
  name                text            not null,
  category_id         uuid            not null references public.inventory_categories(id) on delete restrict,
  unit                text            not null,
  current_stock       numeric(12, 3)  not null default 0,
  minimum_stock       numeric(12, 3)  not null default 0,
  maximum_stock       numeric(12, 3),
  purchase_price      numeric(10, 2),
  supplier            text,
  last_purchase_date  date,
  expiration_date     date,
  notes               text,
  image_url           text,
  is_active           boolean         not null default true,
  deleted_at          timestamptz,
  created_at          timestamptz     not null default now(),
  updated_at          timestamptz     not null default now(),

  constraint inventory_items_unit check (unit in ('pcs', 'g', 'kg', 'ml', 'l')),
  constraint inventory_items_stock_nonneg check (current_stock >= 0 and minimum_stock >= 0)
);

-- Ensure columns exist even if an earlier partial run already created the
-- table without them (e.g. a prior attempt at this same migration).
alter table public.inventory_items add column if not exists maximum_stock numeric(12, 3);
alter table public.inventory_items add column if not exists image_url text;
alter table public.inventory_items add column if not exists is_active boolean not null default true;
alter table public.inventory_items add column if not exists deleted_at timestamptz;

create table if not exists public.inventory_consumption_rules (
  ingredient_id       text            primary key,
  inventory_item_id   uuid            not null references public.inventory_items(id) on delete cascade,
  consumption_amount  numeric(12, 3)  not null check (consumption_amount > 0),
  consumption_unit    text            not null,
  updated_at          timestamptz     not null default now(),

  constraint inventory_consumption_rules_unit check (consumption_unit in ('pcs', 'g', 'kg', 'ml', 'l'))
);

create table if not exists public.purchase_receipts (
  id                  uuid            primary key default gen_random_uuid(),
  inventory_item_id   uuid            not null references public.inventory_items(id) on delete cascade,
  amount              numeric(12, 3)  not null check (amount > 0),
  note                text,
  received_by         uuid            references public.profiles(id) on delete set null,
  created_at          timestamptz     not null default now()
);

create table if not exists public.inventory_transactions (
  id                  uuid            primary key default gen_random_uuid(),
  inventory_item_id   uuid            not null references public.inventory_items(id) on delete cascade,
  order_id            uuid            references public.orders(id) on delete set null,
  purchase_receipt_id uuid            references public.purchase_receipts(id) on delete set null,
  change_amount       numeric(12, 3)  not null,
  reason              text            not null,
  note                text,
  waste_reason        text,
  created_at          timestamptz     not null default now(),

  constraint inventory_transactions_reason check (
    reason in ('order_consumption', 'order_reversal', 'purchase_received', 'manual_adjustment', 'waste')
  )
);

alter table public.inventory_transactions add column if not exists waste_reason text;

-- Widen the reason constraint too, in case this table already existed from
-- an earlier partial attempt with the original 4-value check.
alter table public.inventory_transactions drop constraint if exists inventory_transactions_reason;
alter table public.inventory_transactions add constraint inventory_transactions_reason
  check (reason in ('order_consumption', 'order_reversal', 'purchase_received', 'manual_adjustment', 'waste'));


-- ═══════════════════════════════════════════════════════════════════════════
-- 2. Row Level Security — admin/staff only
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.inventory_categories        enable row level security;
alter table public.inventory_items             enable row level security;
alter table public.inventory_consumption_rules enable row level security;
alter table public.purchase_receipts           enable row level security;
alter table public.inventory_transactions      enable row level security;

drop policy if exists "inventory_categories: admin/staff" on public.inventory_categories;
create policy "inventory_categories: admin/staff"
  on public.inventory_categories for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'staff')))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'staff')));

drop policy if exists "inventory_items: admin/staff" on public.inventory_items;
create policy "inventory_items: admin/staff"
  on public.inventory_items for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'staff')))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'staff')));

drop policy if exists "inventory_consumption_rules: admin/staff" on public.inventory_consumption_rules;
create policy "inventory_consumption_rules: admin/staff"
  on public.inventory_consumption_rules for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'staff')))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'staff')));

drop policy if exists "purchase_receipts: admin/staff" on public.purchase_receipts;
create policy "purchase_receipts: admin/staff"
  on public.purchase_receipts for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'staff')))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'staff')));

drop policy if exists "inventory_transactions: admin/staff" on public.inventory_transactions;
create policy "inventory_transactions: admin/staff"
  on public.inventory_transactions for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'staff')))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'staff')));


-- ═══════════════════════════════════════════════════════════════════════════
-- 3. Grants
-- ═══════════════════════════════════════════════════════════════════════════

grant select, insert, update, delete on public.inventory_categories        to authenticated;
grant select, insert, update, delete on public.inventory_items             to authenticated;
grant select, insert, update, delete on public.inventory_consumption_rules to authenticated;
grant select, insert, update, delete on public.purchase_receipts           to authenticated;
grant select, insert, update, delete on public.inventory_transactions      to authenticated;


-- ═══════════════════════════════════════════════════════════════════════════
-- 4. updated_at trigger (reuses public.set_updated_at() from migration 002)
-- ═══════════════════════════════════════════════════════════════════════════

drop trigger if exists inventory_items_updated_at on public.inventory_items;
create trigger inventory_items_updated_at
  before update on public.inventory_items
  for each row execute procedure public.set_updated_at();

drop trigger if exists inventory_consumption_rules_updated_at on public.inventory_consumption_rules;
create trigger inventory_consumption_rules_updated_at
  before update on public.inventory_consumption_rules
  for each row execute procedure public.set_updated_at();


-- ═══════════════════════════════════════════════════════════════════════════
-- 5. Unit conversion + consumption helpers
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.inv_convert_unit(p_amount numeric, p_from_unit text, p_to_unit text)
returns numeric
language plpgsql
immutable
as $$
begin
  if p_from_unit = p_to_unit then return p_amount; end if;
  if p_from_unit = 'g'  and p_to_unit = 'kg' then return p_amount / 1000.0; end if;
  if p_from_unit = 'kg' and p_to_unit = 'g'  then return p_amount * 1000.0; end if;
  if p_from_unit = 'ml' and p_to_unit = 'l'  then return p_amount / 1000.0; end if;
  if p_from_unit = 'l'  and p_to_unit = 'ml' then return p_amount * 1000.0; end if;
  return p_amount;
end;
$$;

create or replace function public.inv_decrement(p_ingredient_id text, p_units numeric, p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rule record;
  v_amount numeric;
begin
  if p_ingredient_id is null or p_units is null or p_units <= 0 then
    return;
  end if;

  select r.inventory_item_id, r.consumption_amount, r.consumption_unit, i.unit
    into v_rule
    from public.inventory_consumption_rules r
    join public.inventory_items i on i.id = r.inventory_item_id
    where r.ingredient_id = p_ingredient_id;

  if not found then
    return;
  end if;

  v_amount := public.inv_convert_unit(v_rule.consumption_amount, v_rule.consumption_unit, v_rule.unit) * p_units;

  update public.inventory_items
    set current_stock = current_stock - v_amount
    where id = v_rule.inventory_item_id;

  insert into public.inventory_transactions (inventory_item_id, order_id, change_amount, reason)
    values (v_rule.inventory_item_id, p_order_id, -v_amount, 'order_consumption');
end;
$$;


-- ═══════════════════════════════════════════════════════════════════════════
-- 6. Automatic stock consumption on order insert
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.consume_inventory_for_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item jsonb;
  v_qty  numeric;
  v_id   text;
  v_kv   record;
begin
  for v_item in select * from jsonb_array_elements(coalesce(NEW.items, '[]'::jsonb))
  loop
    v_qty := coalesce((v_item->>'quantity')::numeric, 1);

    if v_item ? 'dough'  and coalesce(v_item->>'dough', '')  <> '' then perform public.inv_decrement(v_item->>'dough',  v_qty, NEW.id); end if;
    if v_item ? 'sauce'  and coalesce(v_item->>'sauce', '')  <> '' then perform public.inv_decrement(v_item->>'sauce',  v_qty, NEW.id); end if;
    if v_item ? 'cheese' and coalesce(v_item->>'cheese', '') <> '' then perform public.inv_decrement(v_item->>'cheese', v_qty, NEW.id); end if;
    if v_item ? 'bun'    and coalesce(v_item->>'bun', '')    <> '' then perform public.inv_decrement(v_item->>'bun',    v_qty, NEW.id); end if;

    if v_item ? 'meats' and jsonb_typeof(v_item->'meats') = 'array' then
      for v_id in select jsonb_array_elements_text(v_item->'meats') loop
        perform public.inv_decrement(v_id, v_qty, NEW.id);
      end loop;
    end if;

    if v_item ? 'vegetables' and jsonb_typeof(v_item->'vegetables') = 'array' then
      for v_id in select jsonb_array_elements_text(v_item->'vegetables') loop
        perform public.inv_decrement(v_id, v_qty, NEW.id);
      end loop;
    end if;

    if v_item ? 'sauces' and jsonb_typeof(v_item->'sauces') = 'array' then
      for v_id in select jsonb_array_elements_text(v_item->'sauces') loop
        perform public.inv_decrement(v_id, v_qty, NEW.id);
      end loop;
    end if;

    if v_item ? 'burger_meats' and jsonb_typeof(v_item->'burger_meats') = 'object' then
      for v_kv in select key, value from jsonb_each_text(v_item->'burger_meats') loop
        perform public.inv_decrement(v_kv.key, v_qty * coalesce(v_kv.value::numeric, 1), NEW.id);
      end loop;
    end if;

    if v_item ? 'cheeses' and jsonb_typeof(v_item->'cheeses') = 'object' then
      for v_kv in select key, value from jsonb_each_text(v_item->'cheeses') loop
        perform public.inv_decrement(v_kv.key, v_qty * coalesce(v_kv.value::numeric, 1), NEW.id);
      end loop;
    end if;
  end loop;

  return NEW;
end;
$$;

drop trigger if exists orders_consume_inventory on public.orders;
create trigger orders_consume_inventory
  after insert on public.orders
  for each row execute function public.consume_inventory_for_order();


-- ═══════════════════════════════════════════════════════════════════════════
-- 7. Cancellation reversal
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.reverse_inventory_for_cancelled_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_txn record;
begin
  if NEW.status = 'cancelled' and OLD.status <> 'cancelled' then
    for v_txn in
      select inventory_item_id, change_amount
      from public.inventory_transactions
      where order_id = NEW.id and reason = 'order_consumption'
    loop
      update public.inventory_items
        set current_stock = current_stock - v_txn.change_amount
        where id = v_txn.inventory_item_id;

      insert into public.inventory_transactions (inventory_item_id, order_id, change_amount, reason)
        values (v_txn.inventory_item_id, NEW.id, -v_txn.change_amount, 'order_reversal');
    end loop;
  end if;
  return NEW;
end;
$$;

drop trigger if exists orders_reverse_inventory on public.orders;
create trigger orders_reverse_inventory
  after update of status on public.orders
  for each row execute function public.reverse_inventory_for_cancelled_order();


-- ═══════════════════════════════════════════════════════════════════════════
-- 8. Stock-mutation RPCs — called from adminService.js
-- ═══════════════════════════════════════════════════════════════════════════

-- Purchase receipt (Receive Stock)
create or replace function public.receive_inventory_stock(p_item_id uuid, p_amount numeric, p_note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_receipt_id uuid;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'staff')) then
    raise exception 'not authorized';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'amount must be positive';
  end if;

  update public.inventory_items
    set current_stock = current_stock + p_amount,
        last_purchase_date = current_date
    where id = p_item_id;

  insert into public.purchase_receipts (inventory_item_id, amount, note, received_by)
    values (p_item_id, p_amount, p_note, auth.uid())
    returning id into v_receipt_id;

  insert into public.inventory_transactions (inventory_item_id, purchase_receipt_id, change_amount, reason, note)
    values (p_item_id, v_receipt_id, p_amount, 'purchase_received', p_note);
end;
$$;

grant execute on function public.receive_inventory_stock(uuid, numeric, text) to authenticated;

-- Manual stock edit (Inventory.jsx Edit modal, when Current Stock changed) —
-- takes the new absolute value; the delta is computed + logged server-side.
create or replace function public.set_inventory_stock(p_item_id uuid, p_new_stock numeric, p_note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current numeric;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'staff')) then
    raise exception 'not authorized';
  end if;
  if p_new_stock is null or p_new_stock < 0 then
    raise exception 'stock must be zero or positive';
  end if;

  select current_stock into v_current from public.inventory_items where id = p_item_id for update;
  if not found then
    raise exception 'inventory item not found';
  end if;

  update public.inventory_items set current_stock = p_new_stock where id = p_item_id;

  insert into public.inventory_transactions (inventory_item_id, change_amount, reason, note)
  values (p_item_id, p_new_stock - v_current, 'manual_adjustment', p_note);
end;
$$;

grant execute on function public.set_inventory_stock(uuid, numeric, text) to authenticated;

-- Record Waste — relative amount wasted; also fills waste_reason (in
-- addition to note, kept for backward-compat with existing callers).
create or replace function public.record_inventory_waste(p_item_id uuid, p_amount numeric, p_note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'staff')) then
    raise exception 'not authorized';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'amount must be positive';
  end if;

  update public.inventory_items
    set current_stock = greatest(current_stock - p_amount, 0)
    where id = p_item_id;

  insert into public.inventory_transactions (inventory_item_id, change_amount, reason, note, waste_reason)
  values (p_item_id, -p_amount, 'waste', p_note, p_note);
end;
$$;

grant execute on function public.record_inventory_waste(uuid, numeric, text) to authenticated;

-- Archive (soft delete) — hard-deleting would cascade and wipe the item's
-- own inventory_transactions ledger, so Delete in the UI archives instead:
-- is_active=false (what fetchInventoryItems filters on) plus a deleted_at
-- timestamp for when it happened.
create or replace function public.archive_inventory_item(p_item_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'staff')) then
    raise exception 'not authorized';
  end if;
  update public.inventory_items
    set is_active = false, deleted_at = now()
    where id = p_item_id;
end;
$$;

grant execute on function public.archive_inventory_item(uuid) to authenticated;


-- ═══════════════════════════════════════════════════════════════════════════
-- 9. Realtime
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.inventory_items        replica identity full;
alter table public.inventory_transactions replica identity full;
alter table public.purchase_receipts      replica identity full;

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'inventory_items') then
    execute 'alter publication supabase_realtime add table public.inventory_items';
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'inventory_transactions') then
    execute 'alter publication supabase_realtime add table public.inventory_transactions';
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'purchase_receipts') then
    execute 'alter publication supabase_realtime add table public.purchase_receipts';
  end if;
end $$;


-- ═══════════════════════════════════════════════════════════════════════════
-- 10. Seed categories — final names, matching Inventory.jsx's CATEGORIES
-- ═══════════════════════════════════════════════════════════════════════════

insert into public.inventory_categories (name, sort_order)
select v.name, v.sort_order
from (values
  ('Refrigerated',      0),
  ('Bread & Dough',     1),
  ('Boxes & Packaging', 2),
  ('Drinks',            3)
) as v(name, sort_order)
where not exists (select 1 from public.inventory_categories where name = v.name);
