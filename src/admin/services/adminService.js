import { supabase } from '../../lib/supabase';

// ── Dashboard ─────────────────────────────────────────────────

export async function fetchDashboardStats() {
  const [ordersRes, revenueRes, usersRes, recentRes] = await Promise.all([
    supabase.from('orders').select('id', { count: 'exact', head: true }),
    supabase.from('orders').select('total_price').neq('status', 'cancelled'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('orders')
      .select('id, customer_name, customer_email, total_price, status, created_at, items')
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  const totalOrders = ordersRes.count ?? 0;
  const revenue = (revenueRes.data ?? []).reduce((sum, r) => sum + Number(r.total_price), 0);
  const totalUsers = usersRes.count ?? 0;
  const recentOrders = recentRes.data ?? [];

  return { totalOrders, revenue, totalUsers, recentOrders };
}


// ── Orders ────────────────────────────────────────────────────

export async function fetchOrders({ status = null, limit = 50, offset = 0 } = {}) {
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

export function subscribeToOrders(callback) {
  return supabase
    .channel('admin-orders')
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
