import { supabase } from '../../services/supabase';

// ── Dashboard stats (all-time) ─────────────────────────────────

export async function fetchDashboardStats() {
  const [ordersRes, revenueRes, usersRes, recentRes] = await Promise.all([
    supabase.from('orders').select('id', { count: 'exact', head: true }),
    supabase.from('orders').select('total_price').neq('status', 'cancelled'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('orders')
      .select('id, customer_name, customer_email, total_price, status, created_at, items')
      .order('created_at', { ascending: false })
      .limit(8),
  ]);

  const totalOrders = ordersRes.count ?? 0;
  const revenue     = (revenueRes.data ?? []).reduce((s, r) => s + Number(r.total_price), 0);
  const totalUsers  = usersRes.count ?? 0;
  const recentOrders = recentRes.data ?? [];

  return { totalOrders, revenue, totalUsers, recentOrders };
}


// ── Today stats ────────────────────────────────────────────────

export async function fetchTodayStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  const [todayOrdersRes, todayRevRes, activeRes, allRevRes] = await Promise.all([
    supabase.from('orders').select('id', { count: 'exact', head: true }).gte('created_at', todayISO),
    supabase.from('orders').select('total_price').gte('created_at', todayISO).neq('status', 'cancelled'),
    supabase.from('orders').select('id', { count: 'exact', head: true })
      .in('status', ['pending', 'confirmed', 'preparing', 'ready']),
    supabase.from('orders').select('total_price').neq('status', 'cancelled'),
  ]);

  const todayRevenue  = (todayRevRes.data ?? []).reduce((s, r) => s + Number(r.total_price), 0);
  const allRevArr     = allRevRes.data ?? [];
  const avgOrderValue = allRevArr.length
    ? allRevArr.reduce((s, r) => s + Number(r.total_price), 0) / allRevArr.length
    : 0;

  return {
    todayOrders:    todayOrdersRes.count ?? 0,
    todayRevenue,
    activeOrders:   activeRes.count ?? 0,
    avgOrderValue,
  };
}


// ── Revenue by day (last N days) ───────────────────────────────

export async function fetchRevenueByDay(days = 7) {
  const since = new Date();
  since.setDate(since.getDate() - days + 1);
  since.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('orders')
    .select('total_price, created_at, status')
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: true });

  if (error) throw error;

  // Build a keyed map of every day in the range
  const map = {};
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    map[key] = { date: key, revenue: 0, orders: 0 };
  }

  (data ?? []).forEach(o => {
    if (o.status === 'cancelled') return;
    const key = o.created_at.slice(0, 10);
    if (map[key]) {
      map[key].revenue += Number(o.total_price);
      map[key].orders++;
    }
  });

  return Object.values(map);
}


// ── Status breakdown ───────────────────────────────────────────

export async function fetchStatusBreakdown() {
  const { data, error } = await supabase
    .from('orders')
    .select('status');

  if (error) throw error;

  const counts = {};
  (data ?? []).forEach(o => {
    counts[o.status] = (counts[o.status] ?? 0) + 1;
  });
  return counts;
}


// ── Top selling items (client-side aggregation) ────────────────

export async function fetchTopItems(limit = 5) {
  const { data, error } = await supabase
    .from('orders')
    .select('items')
    .neq('status', 'cancelled');

  if (error) throw error;

  const counts = {};
  (data ?? []).forEach(order => {
    if (!Array.isArray(order.items)) return;
    order.items.forEach(item => {
      const name = item.name || (item.type === 'burger' ? 'Custom Burger' : 'Custom Pizza');
      const qty  = item.quantity ?? 1;
      counts[name] = (counts[name] ?? 0) + qty;
    });
  });

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}


// ── Orders ────────────────────────────────────────────────────

/**
 * Returns the ISO timestamp for the very start of yesterday in local
 * (restaurant) time. Used as the lower bound for the Orders panel window
 * so only today + yesterday are fetched and displayed.
 */
export function getYesterdayStart() {
  const d = new Date();
  d.setDate(d.getDate() - 1); // go back one day
  d.setHours(0, 0, 0, 0);    // midnight of yesterday, local time
  return d.toISOString();     // Postgres expects ISO; toISOString() gives UTC which is correct for .gte()
}

export async function fetchOrders({ status = null, limit = 100, offset = 0, since = null } = {}) {
  let q = supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) q = q.eq('status', status);
  if (since)  q = q.gte('created_at', since);

  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function updateOrderStatus(orderId, status) {
  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)
    .select()
    .single();
  if (error) {
    console.error('[updateOrderStatus] Supabase error', {
      code: error.code, message: error.message,
      hint: error.hint, details: error.details,
      orderId, status,
    });
    throw error;
  }
  return data;
}

export async function assignDriver(orderId, driverName) {
  if (!driverName?.trim()) throw new Error('Driver name is required');
  const { data, error } = await supabase
    .from('orders')
    .update({ driver_name: driverName.trim() })
    .eq('id', orderId)
    .select()
    .single();
  if (error) {
    console.error('[assignDriver] Supabase error', {
      code: error.code, message: error.message,
      hint: error.hint, details: error.details,
      orderId, driverName,
    });
    throw error;
  }
  return data;
}

export async function assignDriverAndAdvance(orderId, driverName, status) {
  if (!driverName?.trim()) throw new Error('Driver name is required');
  if (!orderId)            throw new Error('Order ID is required');
  console.log('[assignDriverAndAdvance] →', { orderId, driverName, status });
  const { data, error } = await supabase
    .from('orders')
    .update({ driver_name: driverName.trim(), status })
    .eq('id', orderId)
    .select()
    .single();
  if (error) {
    console.error('[assignDriverAndAdvance] Supabase error', {
      code: error.code, message: error.message,
      hint: error.hint, details: error.details,
      orderId, driverName, status,
    });
    throw error;
  }
  console.log('[assignDriverAndAdvance] ✓ updated row:', data?.id);
  return data;
}

export function subscribeToOrders(callback, channelName = 'admin-orders') {
  return supabase
    .channel(channelName)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, callback)
    .subscribe();
}


// ── Products ──────────────────────────────────────────────────

export async function fetchProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createProduct(product) {
  const { data, error } = await supabase
    .from('products')
    .insert(product)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateProduct(id, updates) {
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProduct(id) {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

export async function toggleProductActive(id, active) {
  return updateProduct(id, { active });
}


// ── Create order (POS / walk-in) ────────────────────────────

export async function createOrder(orderData) {
  const { data, error } = await supabase
    .from('orders')
    .insert(orderData)
    .select()
    .single();
  if (error) throw error;
  return data;
}


// ── Users ─────────────────────────────────────────────────────

export async function fetchUsers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function updateUserRole(id, role) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}


// ── Drivers ───────────────────────────────────────────────────

export async function fetchActiveDrivers() {
  const { data, error } = await supabase
    .from('drivers')
    .select('id, full_name, phone, vehicle_type')
    .eq('is_active', true)
    .order('full_name');
  if (error) throw error;
  return data ?? [];
}

export async function fetchAllDrivers() {
  const { data, error } = await supabase
    .from('drivers')
    .select('id, full_name, phone, email, vehicle_type, notes, is_active, created_at')
    .order('full_name');
  if (error) throw error;
  return data ?? [];
}

export async function createDriver(driver) {
  const { data, error } = await supabase
    .from('drivers')
    .insert(driver)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateDriver(id, updates) {
  const { data, error } = await supabase
    .from('drivers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function toggleDriverActive(id, is_active) {
  return updateDriver(id, { is_active });
}

export async function createDriverAssignment(orderId, driverId) {
  const { data, error } = await supabase
    .from('driver_assignments')
    .insert({ order_id: orderId, driver_id: driverId, status: 'assigned' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchAssignmentsWithOrders(since = null) {
  let q = supabase
    .from('driver_assignments')
    .select('id, driver_id, assigned_at, status, orders(id, customer_name, delivery_address, total_price, status, created_at)')
    .order('assigned_at', { ascending: false });
  if (since) q = q.gte('assigned_at', since);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function fetchDriverHistory(driverId) {
  const { data, error } = await supabase
    .from('driver_assignments')
    .select('id, assigned_at, completed_at, status, notes, orders(id, customer_name, delivery_address, total_price, status, created_at, items)')
    .eq('driver_id', driverId)
    .order('assigned_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchDriverById(id) {
  const { data, error } = await supabase
    .from('drivers')
    .select('id, full_name, phone, email, vehicle_type, notes, is_active, created_at')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}


// ── Inventory ─────────────────────────────────────────────────

export async function fetchInventoryCategories() {
  const { data, error } = await supabase
    .from('inventory_categories')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createInventoryCategory(name) {
  const { data, error } = await supabase
    .from('inventory_categories')
    .insert({ name })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchInventoryItems() {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createInventoryItem(item) {
  const { data, error } = await supabase
    .from('inventory_items')
    .insert(item)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateInventoryItem(id, updates) {
  const { data, error } = await supabase
    .from('inventory_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteInventoryItem(id) {
  const { error } = await supabase.from('inventory_items').delete().eq('id', id);
  if (error) throw error;
}

// Archives (soft-deletes) an item instead of hard-deleting it, so its
// inventory_transactions history survives — see migration 024.
export async function archiveInventoryItem(itemId) {
  const { error } = await supabase.rpc('archive_inventory_item', { p_item_id: itemId });
  if (error) throw error;
}

// Manual stock edit (Inventory.jsx Edit modal, Current Stock field) — takes
// the new absolute value; the DB computes+logs the delta as a transaction.
export async function setInventoryStock(itemId, newStock, note = null) {
  const { error } = await supabase.rpc('set_inventory_stock', {
    p_item_id: itemId,
    p_new_stock: newStock,
    p_note: note,
  });
  if (error) throw error;
}

// Record Waste — relative amount wasted, not an absolute new stock value.
export async function recordInventoryWaste(itemId, amount, note = null) {
  const { error } = await supabase.rpc('record_inventory_waste', {
    p_item_id: itemId,
    p_amount: amount,
    p_note: note,
  });
  if (error) throw error;
}

export async function fetchConsumptionRules() {
  const { data, error } = await supabase
    .from('inventory_consumption_rules')
    .select('*');
  if (error) throw error;
  return data ?? [];
}

export async function upsertConsumptionRule(rule) {
  const { data, error } = await supabase
    .from('inventory_consumption_rules')
    .upsert(rule, { onConflict: 'ingredient_id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function removeConsumptionRule(ingredientId) {
  const { error } = await supabase
    .from('inventory_consumption_rules')
    .delete()
    .eq('ingredient_id', ingredientId);
  if (error) throw error;
}

export async function receiveStock(itemId, amount, note = null) {
  const { error } = await supabase.rpc('receive_inventory_stock', {
    p_item_id: itemId,
    p_amount: amount,
    p_note: note,
  });
  if (error) throw error;
}

export async function fetchRecentReceipts(limit = 20) {
  const { data, error } = await supabase
    .from('purchase_receipts')
    .select('id, inventory_item_id, amount, note, created_at, inventory_items(name, unit)')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

// ── Analytics ─────────────────────────────────────────────────
// All backed by security-definer RPCs (migration 024) that aggregate
// directly in Postgres over [from, to) — see src/admin/utils/dateRanges.js
// for how callers build the from/to pair for each time filter.

export async function fetchAnalyticsOverview(from, to) {
  const { data, error } = await supabase.rpc('analytics_overview', {
    p_from: from.toISOString(),
    p_to: to.toISOString(),
  });
  if (error) throw error;
  return data?.[0] ?? null;
}

export async function fetchSalesTimeseries(from, to, granularity = 'day') {
  const { data, error } = await supabase.rpc('analytics_sales_timeseries', {
    p_from: from.toISOString(),
    p_to: to.toISOString(),
    p_granularity: granularity,
  });
  if (error) throw error;
  return data ?? [];
}

export async function fetchBestSellers(from, to, limit = 10) {
  const [productsRes, categoriesRes] = await Promise.all([
    supabase.rpc('analytics_best_sellers', {
      p_from: from.toISOString(), p_to: to.toISOString(), p_limit: limit,
    }),
    supabase.rpc('analytics_best_categories', {
      p_from: from.toISOString(), p_to: to.toISOString(),
    }),
  ]);
  if (productsRes.error) throw productsRes.error;
  if (categoriesRes.error) throw categoriesRes.error;
  return { products: productsRes.data ?? [], categories: categoriesRes.data ?? [] };
}

export async function fetchTopCustomers(from, to, limit = 20) {
  const { data, error } = await supabase.rpc('analytics_top_customers', {
    p_from: from.toISOString(), p_to: to.toISOString(), p_limit: limit,
  });
  if (error) throw error;
  return data ?? [];
}

export async function fetchInventoryAnalytics(from, to) {
  const { data, error } = await supabase.rpc('analytics_inventory', {
    p_from: from.toISOString(), p_to: to.toISOString(),
  });
  if (error) throw error;
  return data ?? [];
}

export async function fetchStockHistory(itemId, from, to) {
  const { data, error } = await supabase.rpc('analytics_stock_history', {
    p_item_id: itemId, p_from: from.toISOString(), p_to: to.toISOString(),
  });
  if (error) throw error;
  return data ?? [];
}

export async function fetchLowStockEvents(from, to) {
  const { data, error } = await supabase.rpc('analytics_low_stock_events', {
    p_from: from.toISOString(), p_to: to.toISOString(),
  });
  if (error) throw error;
  return data ?? [];
}


export async function fetchTodayConsumptionValue() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [itemsRes, txnRes] = await Promise.all([
    supabase.from('inventory_items').select('id, purchase_price'),
    supabase.from('inventory_transactions')
      .select('inventory_item_id, change_amount')
      .eq('reason', 'order_consumption')
      .gte('created_at', today.toISOString()),
  ]);
  if (itemsRes.error) throw itemsRes.error;
  if (txnRes.error) throw txnRes.error;

  const priceById = Object.fromEntries(
    (itemsRes.data ?? []).map(i => [i.id, Number(i.purchase_price ?? 0)]),
  );
  return (txnRes.data ?? []).reduce(
    (sum, t) => sum + Math.abs(Number(t.change_amount)) * (priceById[t.inventory_item_id] ?? 0),
    0,
  );
}
