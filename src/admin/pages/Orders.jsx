import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchOrders, updateOrderStatus, subscribeToOrders } from '../services/adminService';

/* ── Status config ─────────────────────────────────────────── */
const STATUS_FLOW = [
  { value: 'pending',   label: 'Pending',          color: '#6366f1', badge: 'adm-badge--indigo' },
  { value: 'confirmed', label: 'Confirmed',         color: '#3b82f6', badge: 'adm-badge--blue'   },
  { value: 'preparing', label: 'Preparing',         color: '#d97706', badge: 'adm-badge--amber'  },
  { value: 'ready',     label: 'Out for delivery',  color: '#f97316', badge: 'adm-badge--orange' },
  { value: 'delivered', label: 'Delivered',         color: '#22c55e', badge: 'adm-badge--green'  },
  { value: 'cancelled', label: 'Cancelled',         color: '#ef4444', badge: 'adm-badge--red'    },
];

const STATUS_MAP = Object.fromEntries(STATUS_FLOW.map(s => [s.value, s]));

function StatusBadge({ status }) {
  const cfg = STATUS_MAP[status];
  if (!cfg) return <span className="adm-badge adm-badge--gray">{status}</span>;
  return (
    <span className={`adm-badge ${cfg.badge}`}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color, display: 'inline-block', marginRight: 3 }} />
      {cfg.label}
    </span>
  );
}

/* ── Helpers ───────────────────────────────────────────────── */
function fmtCurrency(n) {
  return '€' + Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

function fmtTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (diff < 1)  return 'Just now';
  if (diff < 60) return `${diff}m ago`;
  const h = Math.floor(diff / 60);
  if (h < 24)   return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function itemsSummary(items) {
  if (!Array.isArray(items) || !items.length) return '—';
  return items.map(i => {
    const label = i.name || i.type || 'Item';
    const qty   = i.quantity ?? 1;
    return qty > 1 ? `${label} ×${qty}` : label;
  }).slice(0, 3).join(', ') + (items.length > 3 ? ` +${items.length - 3} more` : '');
}

function capitalize(s) {
  return s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : '';
}

function getCustomizations(item) {
  const rows = [];
  if (item.type === 'burger' || item.bun) {
    if (item.bun) rows.push({ label: 'Bun', value: capitalize(item.bun) });
    const bm = item.burger_meats;
    if (bm && typeof bm === 'object') {
      const list = Object.entries(bm).filter(([, q]) => q > 0)
        .map(([id, q]) => q > 1 ? `${capitalize(id)} ×${q}` : capitalize(id)).join(', ');
      if (list) rows.push({ label: 'Meat', value: list });
    }
    const cheeses = item.cheeses;
    if (cheeses && typeof cheeses === 'object') {
      const list = Object.entries(cheeses).filter(([, q]) => q > 0)
        .map(([id, q]) => q > 1 ? `${capitalize(id)} ×${q}` : capitalize(id)).join(', ');
      if (list) rows.push({ label: 'Cheese', value: list });
    }
    if (Array.isArray(item.sauces) && item.sauces.length)
      rows.push({ label: 'Sauces', value: item.sauces.map(capitalize).join(', ') });
    if (Array.isArray(item.vegetables) && item.vegetables.length)
      rows.push({ label: 'Toppings', value: item.vegetables.map(capitalize).join(', ') });
  } else {
    if (item.dough) rows.push({ label: 'Dough',  value: capitalize(item.dough) });
    if (item.sauce) rows.push({ label: 'Sauce',  value: capitalize(item.sauce) });
    if (item.cheese) rows.push({ label: 'Cheese', value: capitalize(item.cheese) });
    if (Array.isArray(item.meats) && item.meats.length)
      rows.push({ label: 'Meats',   value: item.meats.map(capitalize).join(', ') });
    if (Array.isArray(item.vegetables) && item.vegetables.length)
      rows.push({ label: 'Toppings', value: item.vegetables.map(capitalize).join(', ') });
  }
  return rows;
}

/* ── Item row (expandable customizations) ─────────────────── */
function ItemRow({ item }) {
  const [open, setOpen] = useState(false);
  const customs = getCustomizations(item);
  const qty     = item.quantity ?? 1;
  const price   = item.price != null ? fmtCurrency(item.price * qty) : null;
  const emoji   = item.type === 'burger' ? '🍔' : '🍕';

  return (
    <div className="adm-order-item">
      <div
        className="adm-order-item-head"
        style={{ cursor: customs.length ? 'pointer' : 'default' }}
        onClick={() => customs.length && setOpen(v => !v)}
      >
        <span className="adm-order-item-emoji">{emoji}</span>
        <div className="adm-order-item-name">
          <span>
            {item.name || 'Item'}
            {qty > 1 && <span className="adm-order-item-qty"> ×{qty}</span>}
          </span>
          {customs.length > 0 && (
            <span className="adm-order-item-toggle">
              {open ? '▲ hide' : '▼ details'}
            </span>
          )}
        </div>
        {price && <span className="adm-order-item-price">{price}</span>}
      </div>
      {open && customs.length > 0 && (
        <div className="adm-order-item-custom">
          {customs.map(c => (
            <div key={c.label} className="adm-order-item-custom-row">
              <span className="adm-order-item-custom-label">{c.label}</span>
              <span className="adm-order-item-custom-value">{c.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Order detail modal ────────────────────────────────────── */
function OrderModal({ order, onClose, onStatusChange }) {
  const [saving, setSaving] = useState(false);

  async function handleStatus(value) {
    if (order.status === value) return;
    setSaving(true);
    try { await onStatusChange(order.id, value); }
    finally { setSaving(false); }
  }

  const addr = order.delivery_address || {};
  const addrLine1 = [addr.street, addr.houseNumber].filter(Boolean).join(' ');
  const addrLine2 = [addr.postalCode, addr.city].filter(Boolean).join(' ');
  const addrFloor = addr.floor ? `Floor: ${addr.floor}` : null;
  const items = Array.isArray(order.items) ? order.items : [];

  return (
    <div className="adm-modal-overlay" onClick={onClose}>
      <div className="adm-modal-card adm-modal-card--order" onClick={e => e.stopPropagation()}>

        <div className="adm-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="adm-modal-title" style={{ fontFamily: 'Courier New,monospace', fontSize: 14 }}>
              #{order.id.slice(0,8).toUpperCase()}
            </span>
            <StatusBadge status={order.status} />
          </div>
          <button className="adm-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="adm-modal-body adm-modal-body--order" style={{ overflowY: 'auto' }}>

          {/* Customer + Address */}
          <div className="adm-order-section-grid">
            <div className="adm-order-section">
              <div className="adm-order-section-label">Customer</div>
              <div className="adm-order-section-value">{order.customer_name || '—'}</div>
              {order.customer_email && (
                <div className="adm-order-section-sub">{order.customer_email}</div>
              )}
              {order.customer_phone && (
                <div className="adm-order-section-sub" style={{ color: 'var(--adm-accent)', fontWeight: 800 }}>
                  📞 {order.customer_phone}
                </div>
              )}
            </div>
            <div className="adm-order-section">
              <div className="adm-order-section-label">Delivery Address</div>
              {addrLine1 && <div className="adm-order-section-value">{addrLine1}</div>}
              {addrFloor  && <div className="adm-order-section-sub">{addrFloor}</div>}
              {addrLine2  && <div className="adm-order-section-sub">{addrLine2}</div>}
              {!addrLine1 && !addrLine2 && <div className="adm-order-section-sub">—</div>}
            </div>
          </div>

          <div className="adm-detail-divider" />

          {/* Items */}
          <div style={{ padding: '14px 22px 4px' }}>
            <div className="adm-order-section-label" style={{ marginBottom: 10 }}>
              Ordered Items ({items.length})
            </div>
          </div>
          {items.length === 0 ? (
            <div style={{ padding: '0 22px 14px', color: 'var(--adm-text-3)', fontSize: 13 }}>No item data</div>
          ) : (
            <div className="adm-order-items-list">
              {items.map((item, i) => <ItemRow key={i} item={item} />)}
            </div>
          )}

          <div className="adm-detail-divider" />

          {/* Summary */}
          <div className="adm-order-summary">
            <div className="adm-order-summary-row">
              <span>Payment method</span>
              <span style={{ textTransform: 'capitalize', fontWeight: 700 }}>{order.payment_method || '—'}</span>
            </div>
            <div className="adm-order-summary-row">
              <span>Order placed</span>
              <span style={{ fontWeight: 700 }}>{fmtDate(order.created_at)}</span>
            </div>
            <div className="adm-order-summary-row adm-order-summary-row--total">
              <span>Total</span>
              <span style={{ color: 'var(--adm-accent-text)' }}>{fmtCurrency(order.total_price)}</span>
            </div>
          </div>

          <div className="adm-detail-divider" />

          {/* Status update */}
          <div className="adm-order-status-section">
            <div className="adm-order-section-label" style={{ marginBottom: 10 }}>Update Status</div>
            <div className="adm-order-status-grid">
              {STATUS_FLOW.map(s => (
                <button
                  key={s.value}
                  className={`adm-order-status-btn${order.status === s.value ? ' adm-order-status-btn--active' : ''}`}
                  onClick={() => handleStatus(s.value)}
                  disabled={saving}
                >
                  <span className={`adm-order-status-dot adm-order-status-dot--${s.value}`} />
                  {s.label}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ── Toast ─────────────────────────────────────────────────── */
function Toast({ toasts }) {
  if (!toasts.length) return null;
  return (
    <div className="adm-toast-wrap">
      {toasts.map(t => (
        <div key={t.id} className={`adm-toast adm-toast--new-order`}>
          <span style={{ fontSize: 18 }}>🛎️</span>
          <div>
            <div style={{ fontWeight: 900, marginBottom: 2 }}>New Order!</div>
            <div style={{ fontSize: 11.5, color: 'var(--adm-text-2)', fontWeight: 700 }}>{t.text}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   ORDERS PAGE
════════════════════════════════════════════════════════════ */
export default function Orders() {
  const [orders,       setOrders]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter,   setDateFilter]   = useState('all');
  const [selected,     setSelected]     = useState(null);
  const [toasts,       setToasts]       = useState([]);
  const [newIds,       setNewIds]       = useState(new Set());
  const channelRef = useRef(null);

  function addToast(text) {
    const id = Date.now();
    setToasts(prev => [...prev, { id, text }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }

  async function load() {
    setLoading(true); setError(null);
    try { setOrders(await fetchOrders()); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    load();
    channelRef.current = subscribeToOrders(({ eventType, new: row, old }) => {
      if (eventType === 'INSERT') {
        setOrders(prev => [row, ...prev]);
        setNewIds(prev => new Set([...prev, row.id]));
        addToast(`${row.customer_name || 'Guest'} · ${fmtCurrency(row.total_price)}`);
        setTimeout(() => setNewIds(prev => { const n = new Set(prev); n.delete(row.id); return n; }), 5000);
      } else if (eventType === 'UPDATE') {
        setOrders(prev => prev.map(o => o.id === row.id ? row : o));
        setSelected(prev => prev?.id === row.id ? row : prev);
      } else if (eventType === 'DELETE') {
        setOrders(prev => prev.filter(o => o.id !== old.id));
      }
    }, 'admin-orders-orders');
    return () => { channelRef.current?.unsubscribe(); };
  }, []);

  const handleStatusChange = useCallback(async (id, status) => {
    const updated = await updateOrderStatus(id, status);
    setOrders(prev => prev.map(o => o.id === id ? updated : o));
    setSelected(prev => prev?.id === id ? updated : prev);
  }, []);

  /* Filter */
  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      o.id.toLowerCase().includes(q) ||
      (o.customer_name  || '').toLowerCase().includes(q) ||
      (o.customer_email || '').toLowerCase().includes(q) ||
      (o.customer_phone || '').includes(q);
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;

    let matchDate = true;
    if (dateFilter !== 'all') {
      const d = new Date(o.created_at);
      const now = new Date();
      if (dateFilter === 'today') {
        matchDate = d.toDateString() === now.toDateString();
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
        matchDate = d >= weekAgo;
      }
    }
    return matchSearch && matchStatus && matchDate;
  });

  const pendingCount = orders.filter(o => o.status === 'pending').length;

  return (
    <>
      <Toast toasts={toasts} />

      {selected && (
        <OrderModal
          order={selected}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Header */}
      <div className="adm-page-header">
        <div className="adm-page-header-left">
          <h1 className="adm-page-title">
            Orders
            {pendingCount > 0 && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                marginLeft: 10, minWidth: 22, height: 22, borderRadius: 11,
                background: '#fbbf24', color: '#1A0A00',
                fontSize: 11, fontWeight: 900, padding: '0 6px',
                verticalAlign: 'middle',
              }}>
                {pendingCount}
              </span>
            )}
          </h1>
          <p className="adm-page-subtitle">
            Live customer orders
            <span className="adm-live-indicator">
              <span className="adm-live-dot" />
              LIVE
            </span>
          </p>
        </div>
        <button className="adm-btn adm-btn--ghost" onClick={load} style={{ height: 38, fontSize: 12 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
          </svg>
          Refresh
        </button>
      </div>

      {/* Toolbar */}
      <div className="adm-toolbar">
        <input
          className="adm-search"
          type="text"
          placeholder="Search by ID, name, email or phone…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="adm-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All statuses</option>
          {STATUS_FLOW.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <select className="adm-select" value={dateFilter} onChange={e => setDateFilter(e.target.value)}>
          <option value="all">All time</option>
          <option value="today">Today</option>
          <option value="week">Last 7 days</option>
        </select>
      </div>

      {error && (
        <div className="adm-card" style={{ marginBottom: 14, color: 'var(--adm-red)', fontSize: 13, padding: '12px 18px' }}>
          Failed to load orders: {error}
        </div>
      )}

      <div className="adm-card">
        {loading ? (
          <div>
            {[1,2,3,4,5].map(i => (
              <div key={i} className="adm-skeleton-row">
                <div className="adm-skeleton" style={{ width: 80, height: 12, borderRadius: 6 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div className="adm-skeleton adm-skeleton-line" style={{ width: '45%' }} />
                  <div className="adm-skeleton adm-skeleton-line" style={{ width: '30%' }} />
                </div>
                <div className="adm-skeleton adm-skeleton-line" style={{ width: 70 }} />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="adm-empty">
            <div className="adm-empty-emoji">📭</div>
            <div className="adm-empty-title">No orders found</div>
            <div className="adm-empty-sub">Try adjusting search or filters.</div>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="adm-table-wrap">
              <table className="adm-table adm-table--clickable">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Phone</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(o => (
                    <tr
                      key={o.id}
                      onClick={() => setSelected(o)}
                      style={newIds.has(o.id) ? { background: 'rgba(22,163,74,0.06)' } : undefined}
                    >
                      <td style={{ fontFamily: 'Courier New,monospace', fontSize: 11, letterSpacing: 0.5, color: 'var(--adm-text-2)', fontWeight: 700 }}>
                        #{o.id.slice(0,8).toUpperCase()}
                        {newIds.has(o.id) && (
                          <span style={{
                            marginLeft: 6, fontSize: 9, fontWeight: 900, letterSpacing: 1,
                            color: '#4ade80', verticalAlign: 'middle',
                          }}>NEW</span>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: 800 }}>{o.customer_name || '—'}</div>
                        <div className="adm-table-muted">{o.customer_email || ''}</div>
                      </td>
                      <td className="adm-table-muted">{o.customer_phone || '—'}</td>
                      <td className="adm-table-muted" style={{ maxWidth: 200 }}>{itemsSummary(o.items)}</td>
                      <td style={{ fontWeight: 900, color: 'var(--adm-accent-text)' }}>{fmtCurrency(o.total_price)}</td>
                      <td><StatusBadge status={o.status} /></td>
                      <td className="adm-table-muted" style={{ textTransform: 'capitalize' }}>{o.payment_method || '—'}</td>
                      <td>
                        <div className="adm-table-muted">{fmtTime(o.created_at)}</div>
                        <div style={{ fontSize: 10.5, color: 'var(--adm-text-4)', fontWeight: 700 }}>{timeAgo(o.created_at)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="adm-order-cards">
              {filtered.map(o => (
                <div
                  key={o.id}
                  className={`adm-order-card${newIds.has(o.id) ? ' adm-order-card--new' : ''}`}
                  onClick={() => setSelected(o)}
                >
                  <div className="adm-order-card-top">
                    <span className="adm-order-card-id">#{o.id.slice(0,8).toUpperCase()}</span>
                    <StatusBadge status={o.status} />
                  </div>
                  <div className="adm-order-card-customer">{o.customer_name || '—'}</div>
                  {o.customer_phone && (
                    <div className="adm-order-card-email">{o.customer_phone}</div>
                  )}
                  <div className="adm-order-card-items">{itemsSummary(o.items)}</div>
                  <div className="adm-order-card-footer">
                    <span className="adm-order-card-total" style={{ color: 'var(--adm-accent-text)' }}>
                      {fmtCurrency(o.total_price)}
                    </span>
                    <span className="adm-order-card-time">{timeAgo(o.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer count */}
      {!loading && filtered.length > 0 && (
        <div style={{ textAlign: 'right', fontSize: 11.5, fontWeight: 700, color: 'var(--adm-text-3)', marginTop: -12 }}>
          Showing {filtered.length} of {orders.length} orders
        </div>
      )}
    </>
  );
}
