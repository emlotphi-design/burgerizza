import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
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

const PIPELINE = [
  { value: 'pending',   label: 'Pending',    icon: '🕐' },
  { value: 'preparing', label: 'Preparing',  icon: '👨‍🍳' },
  { value: 'ready',     label: 'On the way', icon: '🛵' },
  { value: 'delivered', label: 'Delivered',  icon: '✅' },
];
const PIPELINE_VALS = PIPELINE.map(p => p.value);

/* ── Helpers ───────────────────────────────────────────────── */
function fmtCurrency(n) {
  return '€' + Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
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
function fmtEstDelivery(iso) {
  if (!iso) return '—';
  const d = new Date(new Date(iso).getTime() + 35 * 60 * 1000);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
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
    if (item.dough)  rows.push({ label: 'Dough',   value: capitalize(item.dough) });
    if (item.sauce)  rows.push({ label: 'Sauce',   value: capitalize(item.sauce) });
    if (item.cheese) rows.push({ label: 'Cheese',  value: capitalize(item.cheese) });
    if (Array.isArray(item.meats) && item.meats.length)
      rows.push({ label: 'Meats',   value: item.meats.map(capitalize).join(', ') });
    if (Array.isArray(item.vegetables) && item.vegetables.length)
      rows.push({ label: 'Toppings', value: item.vegetables.map(capitalize).join(', ') });
  }
  return rows;
}

/* ═══════════════════════════════════════════════════════════
   COMPACT PIPELINE — always visible in each row
═══════════════════════════════════════════════════════════ */
function CompactPipeline({ status }) {
  if (status === 'cancelled') {
    return (
      <div className="adm-cpipe-cancelled">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
        Cancelled
      </div>
    );
  }

  const idx          = PIPELINE_VALS.indexOf(status);
  const effectiveIdx = idx === -1 ? 0 : idx;

  return (
    <div className="adm-cpipe">
      {PIPELINE.map((step, i) => {
        const done   = i < effectiveIdx;
        const active = i === effectiveIdx;
        return (
          <Fragment key={step.value}>
            <div className={`adm-cpipe-step${done ? ' adm-cpipe-step--done' : active ? ' adm-cpipe-step--active' : ''}`}>
              <div className="adm-cpipe-dot">
                {done ? (
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : (
                  <span className="adm-cpipe-icon">{step.icon}</span>
                )}
              </div>
              <span className="adm-cpipe-label">{step.label}</span>
            </div>
            {i < PIPELINE.length - 1 && (
              <div className={`adm-cpipe-line${done ? ' adm-cpipe-line--done' : ''}`} />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ROW ACTIONS — always visible on the right
═══════════════════════════════════════════════════════════ */
function RowActions({ order, onAction, saving, infoOpen, onToggleInfo }) {
  const { status } = order;
  const canAccept  = status === 'pending'  || status === 'confirmed';
  const canDeliver = status === 'preparing';
  const canDone    = status === 'ready';
  const canCancel  = !['delivered', 'cancelled'].includes(status);

  return (
    <div className="adm-row-actions">
      {canAccept && (
        <button
          className="adm-row-btn adm-row-btn--accept"
          onClick={() => onAction(order.id, 'preparing')}
          disabled={saving}
          title="Accept Order"
        >
          {saving ? <span className="adm-action-spinner adm-action-spinner--sm" /> : (
            <>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Accept Order
            </>
          )}
        </button>
      )}

      {canDeliver && (
        <button
          className="adm-row-btn adm-row-btn--deliver"
          onClick={() => onAction(order.id, 'ready')}
          disabled={saving}
          title="Out For Delivery"
        >
          {saving ? <span className="adm-action-spinner adm-action-spinner--sm" /> : (
            <><span style={{ fontSize: 12 }}>🛵</span> Out For Delivery</>
          )}
        </button>
      )}

      {canDone && (
        <button
          className="adm-row-btn adm-row-btn--done"
          onClick={() => onAction(order.id, 'delivered')}
          disabled={saving}
          title="Mark Delivered"
        >
          {saving ? <span className="adm-action-spinner adm-action-spinner--sm" /> : (
            <>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Mark Delivered
            </>
          )}
        </button>
      )}

      {canCancel && (
        <button
          className="adm-row-btn adm-row-btn--cancel"
          onClick={() => onAction(order.id, 'cancelled')}
          disabled={saving}
          title="Cancel Order"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
          Cancel
        </button>
      )}

      <button
        className={`adm-info-btn${infoOpen ? ' adm-info-btn--open' : ''}`}
        onClick={onToggleInfo}
        aria-label="Toggle order details"
        aria-expanded={infoOpen}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8"  x2="12"   y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        Info
        <svg
          width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
          style={{ transition: 'transform 0.22s ease', transform: infoOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   INFO PANEL — customer / delivery / items / payment only
═══════════════════════════════════════════════════════════ */
function OrderInfoPanel({ order }) {
  const addr  = order.delivery_address || {};
  const items = Array.isArray(order.items) ? order.items : [];

  return (
    <div className="adm-info-panel">

      {/* Three-column info grid */}
      <div className="adm-info-grid">

        {/* Customer */}
        <div className="adm-info-section">
          <div className="adm-info-section-title">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            Customer
          </div>
          <div className="adm-info-row">
            <span className="adm-info-key">Name</span>
            <span className="adm-info-val">{order.customer_name || '—'}</span>
          </div>
          <div className="adm-info-row">
            <span className="adm-info-key">Email</span>
            <span className="adm-info-val adm-info-val--mono">{order.customer_email || '—'}</span>
          </div>
          <div className="adm-info-row">
            <span className="adm-info-key">Phone</span>
            <span className="adm-info-val adm-info-val--phone">{order.customer_phone || '—'}</span>
          </div>
        </div>

        {/* Delivery */}
        <div className="adm-info-section">
          <div className="adm-info-section-title">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            Delivery Address
          </div>
          <div className="adm-info-row">
            <span className="adm-info-key">Street</span>
            <span className="adm-info-val">
              {[addr.street, addr.houseNumber].filter(Boolean).join(' ') || '—'}
            </span>
          </div>
          {addr.floor && (
            <div className="adm-info-row">
              <span className="adm-info-key">Floor</span>
              <span className="adm-info-val">{addr.floor}</span>
            </div>
          )}
          {addr.doorbellName && (
            <div className="adm-info-row">
              <span className="adm-info-key">Bell</span>
              <span className="adm-info-val">{addr.doorbellName}</span>
            </div>
          )}
          <div className="adm-info-row">
            <span className="adm-info-key">City</span>
            <span className="adm-info-val">
              {[addr.postalCode, addr.city].filter(Boolean).join(' ') || '—'}
            </span>
          </div>
        </div>

        {/* Payment + Time */}
        <div className="adm-info-section">
          <div className="adm-info-section-title">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <rect x="2" y="5" width="20" height="14" rx="2"/>
              <line x1="2" y1="10" x2="22" y2="10"/>
            </svg>
            Payment & Time
          </div>
          <div className="adm-info-row">
            <span className="adm-info-key">Method</span>
            <span className="adm-info-val" style={{ textTransform: 'capitalize' }}>
              {order.payment_method || '—'}
            </span>
          </div>
          <div className="adm-info-row">
            <span className="adm-info-key">Placed</span>
            <span className="adm-info-val">{fmtDate(order.created_at)}</span>
          </div>
          <div className="adm-info-row">
            <span className="adm-info-key">Est. delivery</span>
            <span className="adm-info-val">{fmtEstDelivery(order.created_at)}</span>
          </div>
          <div className="adm-info-row">
            <span className="adm-info-key">Total</span>
            <span className="adm-info-val adm-info-val--total">{fmtCurrency(order.total_price)}</span>
          </div>
        </div>
      </div>

      {/* Order items */}
      <div className="adm-info-items-section">
        <div className="adm-info-items-title">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 01-8 0"/>
          </svg>
          Ordered Items <span className="adm-info-items-count">({items.length})</span>
        </div>
        {items.length === 0 ? (
          <div className="adm-info-empty">No item data available</div>
        ) : (
          <div className="adm-info-items-list">
            {items.map((item, i) => {
              const customs = getCustomizations(item);
              const qty     = item.quantity ?? 1;
              const price   = item.price != null ? fmtCurrency(item.price * qty) : null;
              const emoji   = item.type === 'burger' ? '🍔' : '🍕';
              return (
                <div key={i} className="adm-info-item">
                  <div className="adm-info-item-head">
                    <span className="adm-info-item-emoji">{emoji}</span>
                    <span className="adm-info-item-name">
                      {item.name || 'Item'}
                      {qty > 1 && <span className="adm-info-item-qty"> ×{qty}</span>}
                    </span>
                    {price && <span className="adm-info-item-price">{price}</span>}
                  </div>
                  {customs.length > 0 && (
                    <div className="adm-info-item-tags">
                      {customs.map(c => (
                        <span key={c.label} className="adm-info-tag">
                          <span className="adm-info-tag-key">{c.label}:</span> {c.value}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
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
        <div key={t.id} className={`adm-toast adm-toast--${t.type || 'new-order'}`}>
          <span style={{ fontSize: 18 }}>{t.icon || '🛎️'}</span>
          <div>
            <div style={{ fontWeight: 900, marginBottom: 2 }}>{t.title}</div>
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
  const [expandedId,   setExpandedId]   = useState(null);
  const [toasts,       setToasts]       = useState([]);
  const [newIds,       setNewIds]       = useState(new Set());
  const [savingIds,    setSavingIds]    = useState(new Set());
  const [successIds,   setSuccessIds]   = useState(new Set());
  const channelRef = useRef(null);

  function addToast(title, text, type = 'new-order', icon = '🛎️') {
    const id = Date.now();
    setToasts(prev => [...prev, { id, title, text, type, icon }]);
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
        addToast('New Order!', `${row.customer_name || 'Guest'} · ${fmtCurrency(row.total_price)}`);
        setTimeout(() => setNewIds(prev => { const n = new Set(prev); n.delete(row.id); return n; }), 5000);
      } else if (eventType === 'UPDATE') {
        setOrders(prev => prev.map(o => o.id === row.id ? row : o));
      } else if (eventType === 'DELETE') {
        setOrders(prev => prev.filter(o => o.id !== old.id));
      }
    }, 'admin-orders-orders');
    return () => { channelRef.current?.unsubscribe(); };
  }, []);

  const handleAction = useCallback(async (id, newStatus) => {
    setSavingIds(prev => new Set([...prev, id]));
    try {
      const updated = await updateOrderStatus(id, newStatus);
      setOrders(prev => prev.map(o => o.id === id ? updated : o));
      setSuccessIds(prev => new Set([...prev, id]));
      setTimeout(() => setSuccessIds(prev => { const n = new Set(prev); n.delete(id); return n; }), 2400);
      const label = STATUS_MAP[newStatus]?.label ?? newStatus;
      const icons = { preparing: '✅', ready: '🛵', delivered: '📦', cancelled: '❌' };
      const types = { preparing: 'accept', ready: 'delivery', delivered: 'update', cancelled: 'error' };
      addToast('Status updated', `Order #${id.slice(0, 8).toUpperCase()} → ${label}`, types[newStatus] ?? 'update', icons[newStatus] ?? '📦');
    } catch {
      addToast('Update failed', 'Please try again', 'error', '❌');
    } finally {
      setSavingIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    }
  }, []);

  /* Filters */
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
            Live restaurant delivery management
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

      {/* Order list */}
      <div className="adm-card">
        {loading ? (
          <div>
            {[1, 2, 3, 4, 5].map(i => (
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
          <div className="adm-orders-list">
            {filtered.map(o => (
              <Fragment key={o.id}>
                <div
                  className={[
                    'adm-orow',
                    newIds.has(o.id)     ? 'adm-orow--new'     : '',
                    successIds.has(o.id) ? 'adm-orow--success' : '',
                    expandedId === o.id  ? 'adm-orow--open'    : '',
                  ].filter(Boolean).join(' ')}
                >
                  {/* ── Main 3-column row ── */}
                  <div className="adm-orow-main">

                    {/* LEFT: order meta */}
                    <div className="adm-orow-left">
                      <div className="adm-orow-id">
                        #{o.id.slice(0, 8).toUpperCase()}
                        {newIds.has(o.id) && (
                          <span className="adm-orow-new-tag">NEW</span>
                        )}
                      </div>
                      <div className="adm-orow-customer">{o.customer_name || '—'}</div>
                      <div className="adm-orow-items">{itemsSummary(o.items)}</div>
                      <div className="adm-orow-foot">
                        <span className="adm-orow-total">{fmtCurrency(o.total_price)}</span>
                        <span className="adm-orow-time">{timeAgo(o.created_at)}</span>
                      </div>
                    </div>

                    {/* CENTER: live pipeline */}
                    <div className="adm-orow-center">
                      <CompactPipeline status={o.status} />
                    </div>

                    {/* RIGHT: action buttons + info toggle */}
                    <div className="adm-orow-right">
                      <RowActions
                        order={o}
                        onAction={handleAction}
                        saving={savingIds.has(o.id)}
                        infoOpen={expandedId === o.id}
                        onToggleInfo={() => setExpandedId(prev => prev === o.id ? null : o.id)}
                      />
                    </div>
                  </div>

                  {/* ── Expandable info drawer ── */}
                  {expandedId === o.id && (
                    <div className="adm-orow-drawer">
                      <OrderInfoPanel order={o} />
                    </div>
                  )}
                </div>
              </Fragment>
            ))}
          </div>
        )}
      </div>

      {!loading && filtered.length > 0 && (
        <div style={{ textAlign: 'right', fontSize: 11.5, fontWeight: 700, color: 'var(--adm-text-3)', marginTop: -12 }}>
          Showing {filtered.length} of {orders.length} orders
        </div>
      )}
    </>
  );
}
