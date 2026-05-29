import { useEffect, useRef, useState } from 'react';
import { fetchOrders, updateOrderStatus, subscribeToOrders } from '../services/adminService';

// DB constraint uses: pending, confirmed, preparing, ready, delivered, cancelled
// We map 'ready' → 'Out for delivery' in the UI
const STATUS_FLOW = [
  { value: 'pending',   label: 'Pending' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'ready',     label: 'Out for delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const STATUS_LABEL = Object.fromEntries(STATUS_FLOW.map(s => [s.value, s.label]));
STATUS_LABEL.confirmed = 'Confirmed';

const BADGE = {
  delivered: <span className="adm-badge adm-badge--green">Delivered</span>,
  preparing: <span className="adm-badge adm-badge--amber">Preparing</span>,
  confirmed: <span className="adm-badge adm-badge--blue">Confirmed</span>,
  ready:     <span className="adm-badge adm-badge--amber">Out for delivery</span>,
  pending:   <span className="adm-badge adm-badge--blue">Pending</span>,
  cancelled: <span className="adm-badge adm-badge--red">Cancelled</span>,
};

function fmtCurrency(n) {
  return '€' + Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function itemsSummary(items) {
  if (!Array.isArray(items) || items.length === 0) return '—';
  return items.map(i => {
    const label = i.name || i.type || 'Item';
    const qty = i.quantity || 1;
    return qty > 1 ? `${label} ×${qty}` : label;
  }).slice(0, 3).join(', ') + (items.length > 3 ? ` +${items.length - 3} more` : '');
}

function capitalize(s) {
  if (!s) return '';
  return String(s).charAt(0).toUpperCase() + String(s).slice(1);
}

function getCustomizations(item) {
  const rows = [];
  if (item.type === 'burger' || item.bun) {
    if (item.bun) rows.push({ label: 'Bun', value: capitalize(item.bun) });
    // burger meats stored as {id: qty}
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
    if (item.dough) rows.push({ label: 'Dough', value: capitalize(item.dough) });
    if (item.sauce) rows.push({ label: 'Sauce', value: capitalize(item.sauce) });
    if (item.cheese) rows.push({ label: 'Cheese', value: capitalize(item.cheese) });
    if (Array.isArray(item.meats) && item.meats.length)
      rows.push({ label: 'Meats', value: item.meats.map(capitalize).join(', ') });
    if (Array.isArray(item.vegetables) && item.vegetables.length)
      rows.push({ label: 'Toppings', value: item.vegetables.map(capitalize).join(', ') });
  }
  return rows;
}

function ItemRow({ item, index }) {
  const [open, setOpen] = useState(false);
  const customizations = getCustomizations(item);
  const qty   = item.quantity ?? 1;
  const price = item.price != null ? fmtCurrency(item.price * qty) : null;
  const emoji = item.type === 'burger' ? '🍔' : '🍕';

  return (
    <div className="adm-order-item">
      <div className="adm-order-item-head" onClick={() => customizations.length && setOpen(v => !v)}>
        <span className="adm-order-item-emoji">{emoji}</span>
        <div className="adm-order-item-name">
          <span>{item.name || 'Item'}{qty > 1 ? <span className="adm-order-item-qty"> ×{qty}</span> : null}</span>
          {customizations.length > 0 && (
            <span className="adm-order-item-toggle">
              {open ? '▲ hide' : '▼ details'}
            </span>
          )}
        </div>
        {price && <span className="adm-order-item-price">{price}</span>}
      </div>
      {open && customizations.length > 0 && (
        <div className="adm-order-item-custom">
          {customizations.map(c => (
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

function OrderModal({ order, onClose, onStatusChange }) {
  const [saving, setSaving] = useState(false);

  async function handleStatus(value) {
    if (order.status === value) return;
    setSaving(true);
    try { await onStatusChange(order.id, value); }
    finally { setSaving(false); }
  }

  const addr = order.delivery_address || {};
  const addrParts = [
    [addr.street, addr.houseNumber].filter(Boolean).join(' '),
    addr.floor ? `Floor: ${addr.floor}` : null,
    [addr.postalCode, addr.city].filter(Boolean).join(' '),
  ].filter(Boolean);

  const items = Array.isArray(order.items) ? order.items : [];

  return (
    <div className="adm-modal-overlay" onClick={onClose}>
      <div className="adm-modal-card adm-modal-card--order" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="adm-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="adm-modal-title">Order #{order.id.slice(0, 8).toUpperCase()}</span>
            {BADGE[order.status] ?? <span className="adm-badge adm-badge--gray">{order.status}</span>}
          </div>
          <button className="adm-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="adm-modal-body adm-modal-body--order">

          {/* Customer + Address */}
          <div className="adm-order-section-grid">
            <div className="adm-order-section">
              <div className="adm-order-section-label">Customer</div>
              <div className="adm-order-section-value">{order.customer_name || '—'}</div>
              <div className="adm-order-section-sub">{order.customer_email || '—'}</div>
              {order.customer_phone && (
                <div className="adm-order-section-sub">{order.customer_phone}</div>
              )}
            </div>
            {addrParts.length > 0 && (
              <div className="adm-order-section">
                <div className="adm-order-section-label">Delivery Address</div>
                {addrParts.map((l, i) => (
                  <div key={i} className={i === 0 ? 'adm-order-section-value' : 'adm-order-section-sub'}>{l}</div>
                ))}
              </div>
            )}
          </div>

          <div className="adm-detail-divider" />

          {/* Items */}
          <div className="adm-order-section-label" style={{ marginBottom: 8 }}>Ordered Items</div>
          {items.length === 0 ? (
            <div className="adm-table-muted" style={{ fontSize: 13 }}>No item data available</div>
          ) : (
            <div className="adm-order-items-list">
              {items.map((item, i) => <ItemRow key={i} item={item} index={i} />)}
            </div>
          )}

          <div className="adm-detail-divider" />

          {/* Summary */}
          <div className="adm-order-summary">
            <div className="adm-order-summary-row">
              <span className="adm-table-muted">Payment</span>
              <span style={{ textTransform: 'capitalize', fontWeight: 700 }}>{order.payment_method || '—'}</span>
            </div>
            <div className="adm-order-summary-row">
              <span className="adm-table-muted">Placed</span>
              <span style={{ fontWeight: 700 }}>{fmtDate(order.created_at)}</span>
            </div>
            <div className="adm-order-summary-row adm-order-summary-row--total">
              <span>Total</span>
              <span>{fmtCurrency(order.total_price)}</span>
            </div>
          </div>

          <div className="adm-detail-divider" />

          {/* Status controls */}
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
  );
}

export default function Orders() {
  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatus] = useState('all');
  const [selected, setSelected]   = useState(null);
  const channelRef = useRef(null);

  useEffect(() => {
    load();
    channelRef.current = subscribeToOrders(({ eventType, new: row, old }) => {
      if (eventType === 'INSERT') {
        setOrders(prev => [row, ...prev]);
      } else if (eventType === 'UPDATE') {
        setOrders(prev => prev.map(o => o.id === row.id ? row : o));
        setSelected(prev => prev?.id === row.id ? row : prev);
      } else if (eventType === 'DELETE') {
        setOrders(prev => prev.filter(o => o.id !== old.id));
      }
    });
    return () => { channelRef.current?.unsubscribe(); };
  }, []);

  async function load() {
    setLoading(true); setError(null);
    try { setOrders(await fetchOrders()); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function handleStatusChange(id, status) {
    const updated = await updateOrderStatus(id, status);
    setOrders(prev => prev.map(o => o.id === id ? updated : o));
    setSelected(prev => prev?.id === id ? updated : prev);
  }

  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      o.id.toLowerCase().includes(q) ||
      (o.customer_name  || '').toLowerCase().includes(q) ||
      (o.customer_email || '').toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <>
      {selected && (
        <OrderModal
          order={selected}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
        />
      )}

      <div className="adm-page-header">
        <h1 className="adm-page-title">Orders</h1>
        <p className="adm-page-subtitle">Live customer orders — updates in real time.</p>
      </div>

      <div className="adm-toolbar">
        <input
          className="adm-search"
          type="text"
          placeholder="Search by ID, name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="adm-select"
          value={statusFilter}
          onChange={e => setStatus(e.target.value)}
        >
          <option value="all">All statuses</option>
          {STATUS_FLOW.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <button className="adm-btn adm-btn--ghost" onClick={load}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
          </svg>
          Refresh
        </button>
      </div>

      {error && (
        <div className="adm-card" style={{ marginBottom: 16, color: 'var(--adm-danger, #e03d3d)', fontSize: 13 }}>
          Failed to load orders: {error}
        </div>
      )}

      <div className="adm-card">
        {loading ? (
          <div className="adm-empty"><div className="adm-empty-sub">Loading orders…</div></div>
        ) : filtered.length === 0 ? (
          <div className="adm-empty">
            <div className="adm-empty-emoji">📭</div>
            <div className="adm-empty-title">No orders found</div>
            <div className="adm-empty-sub">Try adjusting your search or filter.</div>
          </div>
        ) : (
          <>
            {/* Desktop/tablet: standard table */}
            <div className="adm-table-wrap">
              <table className="adm-table adm-table--clickable">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(o => (
                    <tr key={o.id} onClick={() => setSelected(o)}>
                      <td style={{ fontWeight: 900 }}>#{o.id.slice(0, 8).toUpperCase()}</td>
                      <td>
                        <div style={{ fontWeight: 800 }}>{o.customer_name || '—'}</div>
                        <div className="adm-table-muted">{o.customer_email || ''}</div>
                      </td>
                      <td className="adm-table-muted">{itemsSummary(o.items)}</td>
                      <td style={{ fontWeight: 900 }}>{fmtCurrency(o.total_price)}</td>
                      <td>{BADGE[o.status] ?? <span className="adm-badge adm-badge--gray">{o.status}</span>}</td>
                      <td className="adm-table-muted">{fmtDate(o.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile: card list (shown via CSS at ≤640px) */}
            <div className="adm-order-cards">
              {filtered.map(o => (
                <div key={o.id} className="adm-order-card" onClick={() => setSelected(o)}>
                  <div className="adm-order-card-top">
                    <span className="adm-order-card-id">#{o.id.slice(0, 8).toUpperCase()}</span>
                    {BADGE[o.status] ?? <span className="adm-badge adm-badge--gray">{o.status}</span>}
                  </div>
                  <div className="adm-order-card-customer">{o.customer_name || '—'}</div>
                  {o.customer_email && (
                    <div className="adm-order-card-email">{o.customer_email}</div>
                  )}
                  <div className="adm-order-card-items">{itemsSummary(o.items)}</div>
                  <div className="adm-order-card-footer">
                    <span className="adm-order-card-total">{fmtCurrency(o.total_price)}</span>
                    <span className="adm-order-card-time">{fmtDate(o.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
