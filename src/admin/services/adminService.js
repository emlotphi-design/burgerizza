import { supabase } from '../../lib/supabase';

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

export async function fetchOrders({ status = null, limit = 100, offset = 0 } = {}) {
  let q = supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) q = q.eq('status', status);

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
  if (error) throw error;
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
