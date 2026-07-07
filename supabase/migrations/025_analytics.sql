/*
  Migration 025 — Analytics RPCs

  Run AFTER 021/023/024 (queries orders, order_items, inventory_items,
  inventory_transactions). Names/signatures match
  src/admin/services/adminService.js exactly.

  Idempotent: every function uses CREATE OR REPLACE.
*/

create or replace function public.analytics_overview(p_from timestamptz, p_to timestamptz)
returns table (
  revenue numeric,
  costs numeric,
  profit numeric,
  order_count bigint,
  avg_order_value numeric,
  delivery_count bigint,
  pickup_count bigint,
  cash_count bigint,
  card_count bigint,
  other_payment_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'staff')) then
    raise exception 'not authorized';
  end if;

  return query
  with in_range as (
    select * from public.orders o
    where o.created_at >= p_from and o.created_at < p_to and o.status <> 'cancelled'
  ),
  cost_calc as (
    select coalesce(sum(-t.change_amount * coalesce(i.purchase_price, 0)), 0) as total_cost
    from public.inventory_transactions t
    join public.inventory_items i on i.id = t.inventory_item_id
    where t.reason = 'order_consumption'
      and t.order_id in (select id from in_range)
  )
  select
    coalesce(sum(r.total_price), 0)                                                as revenue,
    (select total_cost from cost_calc)                                             as costs,
    coalesce(sum(r.total_price), 0) - (select total_cost from cost_calc)           as profit,
    count(*)                                                                       as order_count,
    case when count(*) > 0 then coalesce(sum(r.total_price), 0) / count(*) else 0 end as avg_order_value,
    count(*) filter (
      where r.order_type in ('pickup', 'walk_in', 'dine_in')
         or r.delivery_address->>'mode' in ('pickup', 'walkin', 'dine_in')
    ) as pickup_count,
    count(*) filter (
      where not (
        r.order_type in ('pickup', 'walk_in', 'dine_in')
        or r.delivery_address->>'mode' in ('pickup', 'walkin', 'dine_in')
      )
    ) as delivery_count,
    count(*) filter (where r.payment_method = 'cash')               as cash_count,
    count(*) filter (where r.payment_method = 'card')                as card_count,
    count(*) filter (where r.payment_method not in ('cash', 'card')) as other_payment_count
  from in_range r;
end;
$$;

grant execute on function public.analytics_overview(timestamptz, timestamptz) to authenticated;


create or replace function public.analytics_sales_timeseries(p_from timestamptz, p_to timestamptz, p_granularity text)
returns table (bucket timestamptz, revenue numeric, order_count bigint)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'staff')) then
    raise exception 'not authorized';
  end if;
  if p_granularity not in ('hour', 'day', 'week', 'month', 'year') then
    raise exception 'invalid granularity: %', p_granularity;
  end if;

  return query
  select date_trunc(p_granularity, o.created_at) as bucket,
         coalesce(sum(o.total_price), 0)         as revenue,
         count(*)                                as order_count
  from public.orders o
  where o.created_at >= p_from and o.created_at < p_to and o.status <> 'cancelled'
  group by bucket
  order by bucket;
end;
$$;

grant execute on function public.analytics_sales_timeseries(timestamptz, timestamptz, text) to authenticated;


create or replace function public.analytics_best_sellers(p_from timestamptz, p_to timestamptz, p_limit int default 10)
returns table (product_name text, product_type text, qty_sold numeric, revenue numeric)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'staff')) then
    raise exception 'not authorized';
  end if;

  return query
  select li.product_name, min(li.product_type) as product_type,
         sum(li.quantity) as qty_sold, sum(li.line_total) as revenue
  from public.order_items li
  join public.orders o on o.id = li.order_id
  where li.created_at >= p_from and li.created_at < p_to and o.status <> 'cancelled'
  group by li.product_name
  order by qty_sold desc
  limit p_limit;
end;
$$;

grant execute on function public.analytics_best_sellers(timestamptz, timestamptz, int) to authenticated;


create or replace function public.analytics_best_categories(p_from timestamptz, p_to timestamptz)
returns table (product_type text, qty_sold numeric, revenue numeric)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'staff')) then
    raise exception 'not authorized';
  end if;

  return query
  select coalesce(nullif(li.product_type, ''), 'other') as product_type,
         sum(li.quantity) as qty_sold, sum(li.line_total) as revenue
  from public.order_items li
  join public.orders o on o.id = li.order_id
  where li.created_at >= p_from and li.created_at < p_to and o.status <> 'cancelled'
  group by product_type
  order by revenue desc;
end;
$$;

grant execute on function public.analytics_best_categories(timestamptz, timestamptz) to authenticated;


create or replace function public.analytics_top_customers(p_from timestamptz, p_to timestamptz, p_limit int default 20)
returns table (customer_name text, customer_contact text, order_count bigint, total_spent numeric)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'staff')) then
    raise exception 'not authorized';
  end if;

  return query
  select
    max(o.customer_name)                                                 as customer_name,
    coalesce(nullif(o.customer_email, ''), nullif(o.customer_phone, '')) as customer_contact,
    count(*)                                                             as order_count,
    sum(o.total_price)                                                   as total_spent
  from public.orders o
  where o.created_at >= p_from and o.created_at < p_to and o.status <> 'cancelled'
  group by customer_contact
  order by total_spent desc
  limit p_limit;
end;
$$;

grant execute on function public.analytics_top_customers(timestamptz, timestamptz, int) to authenticated;


create or replace function public.analytics_inventory(p_from timestamptz, p_to timestamptz)
returns table (
  inventory_item_id uuid,
  item_name text,
  unit text,
  consumed numeric,
  wasted numeric,
  received numeric,
  current_stock numeric,
  minimum_stock numeric
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'staff')) then
    raise exception 'not authorized';
  end if;

  return query
  select
    i.id,
    i.name,
    i.unit,
    coalesce(sum(-t.change_amount) filter (where t.reason = 'order_consumption'), 0) as consumed,
    coalesce(sum(-t.change_amount) filter (where t.reason = 'waste'), 0)             as wasted,
    coalesce(sum(t.change_amount) filter (where t.reason = 'purchase_received'), 0)  as received,
    i.current_stock,
    i.minimum_stock
  from public.inventory_items i
  left join public.inventory_transactions t
    on t.inventory_item_id = i.id and t.created_at >= p_from and t.created_at < p_to
  where i.is_active = true
  group by i.id, i.name, i.unit, i.current_stock, i.minimum_stock
  order by consumed desc;
end;
$$;

grant execute on function public.analytics_inventory(timestamptz, timestamptz) to authenticated;


create or replace function public.analytics_stock_history(p_item_id uuid, p_from timestamptz, p_to timestamptz)
returns table ("at" timestamptz, stock_level numeric, reason text, change_amount numeric)
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

  select current_stock into v_current from public.inventory_items where id = p_item_id;
  if not found then
    raise exception 'inventory item not found';
  end if;

  return query
  with txns as (
    select t.created_at, t.change_amount, t.reason
    from public.inventory_transactions t
    where t.inventory_item_id = p_item_id
  ),
  running as (
    select
      created_at,
      reason,
      change_amount,
      v_current - coalesce(
        sum(change_amount) over (order by created_at desc rows between unbounded preceding and 1 preceding),
        0
      ) as stock_after
    from txns
  )
  select created_at as "at", stock_after as stock_level, reason, change_amount
  from running
  where created_at >= p_from and created_at < p_to
  order by created_at;
end;
$$;

grant execute on function public.analytics_stock_history(uuid, timestamptz, timestamptz) to authenticated;


create or replace function public.analytics_low_stock_events(p_from timestamptz, p_to timestamptz)
returns table (inventory_item_id uuid, item_name text, "at" timestamptz, stock_level numeric, minimum_stock numeric)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'staff')) then
    raise exception 'not authorized';
  end if;

  return query
  with per_item as (
    select
      i.id as inventory_item_id, i.name as item_name, i.minimum_stock, i.current_stock,
      t.created_at, t.change_amount
    from public.inventory_items i
    join public.inventory_transactions t on t.inventory_item_id = i.id
    where i.is_active = true
  ),
  running as (
    select
      inventory_item_id, item_name, minimum_stock, created_at,
      current_stock - coalesce(
        sum(change_amount) over (partition by inventory_item_id order by created_at desc rows between unbounded preceding and 1 preceding),
        0
      ) as stock_after
    from per_item
  )
  select inventory_item_id, item_name, created_at as "at", stock_after as stock_level, minimum_stock
  from running
  where created_at >= p_from and created_at < p_to
    and minimum_stock > 0 and stock_after <= minimum_stock
  order by created_at desc;
end;
$$;

grant execute on function public.analytics_low_stock_events(timestamptz, timestamptz) to authenticated;
