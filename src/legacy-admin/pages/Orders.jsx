import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchOrders, updateOrderStatus, subscribeToOrders, assignDriverAndAdvance, getYesterdayStart, fetchActiveDrivers, createDriverAssignment } from '../services/adminService';
import { useRestaurantMode } from '../../store/RestaurantModeContext';
import { useOrdering } from '../../store/OrderingContext';
import {
  playOrderNotification,
  showBrowserNotification,
  requestNotificationPermission,
  unlockAudio,
  toggleMute,
  getMuted,
} from '../../utils/playOrderNotification';

/* ── Status config ─────────────────────────────────────────── */
const STATUS_FLOW = [
  { value: 'waiting_confirmation', label: 'Waiting', color: '#eab308', badge: 'adm-badge--waiting' },
  { value: 'pending', label: 'Pending', color: '#6366f1', badge: 'adm-badge--indigo' },
  { value: 'confirmed', label: 'Confirmed', color: '#3b82f6', badge: 'adm-badge--blue' },
  { value: 'preparing', label: 'Preparing', color: '#d97706', badge: 'adm-badge--amber' },
  { value: 'ready', label: 'Out for delivery', color: '#f97316', badge: 'adm-badge--orange' },
  { value: 'delivered', label: 'Delivered', color: '#22c55e', badge: 'adm-badge--green' },
  { value: 'cancelled', label: 'Cancelled', color: '#ef4444', badge: 'adm-badge--red' },
];
const STATUS_MAP = Object.fromEntries(STATUS_FLOW.map(s => [s.value, s]));

const PIPELINE = [
  { value: 'pending', label: 'Pending', icon: '🕐' },
  { value: 'confirmed', label: 'Approved', icon: '✓' },
  { value: 'preparing', label: 'Preparing', icon: '👨‍🍳' },
  { value: 'ready', label: 'On the way', icon: '🛵' },
  { value: 'delivered', label: 'Delivered', icon: '✅' },
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
  if (diff < 1) return 'Just now';
  if (diff < 60) return `${diff}m ago`;
  const h = Math.floor(diff / 60);
  if (h < 24) return `${h}h ago`;
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
    const qty = i.quantity ?? 1;
    return qty > 1 ? `${label} ×${qty}` : label;
  }).slice(0, 3).join(', ') + (items.length > 3 ? ` +${items.length - 3} more` : '');
}
function capitalize(s) {
  return s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : '';
}
function isInWindow(iso) {
  if (!iso) return false;
  const windowStart = new Date();
  windowStart.setDate(windowStart.getDate() - 1);
  windowStart.setHours(0, 0, 0, 0);
  return new Date(iso) >= windowStart;
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

function getKeyMods(item) {
  const pills = [];
  if (item.cheeses && typeof item.cheeses === 'object') {
    Object.entries(item.cheeses).filter(([, q]) => q > 0).forEach(([id]) => pills.push(capitalize(id)));
  }
  if (Array.isArray(item.sauces)) item.sauces.forEach(s => pills.push(capitalize(s)));
  else if (item.sauce) pills.push(capitalize(item.sauce));
  if (item.cheese) pills.push(capitalize(item.cheese));
  if (Array.isArray(item.meats)) item.meats.forEach(m => pills.push(capitalize(m)));
  if (Array.isArray(item.vegetables)) item.vegetables.forEach(v => pills.push(capitalize(v)));
  return pills.slice(0, 5);
}

function InlineOrderItems({ items }) {
  if (!Array.isArray(items) || !items.length) {
    return <div className="adm-row-items adm-row-items--empty">—</div>;
  }
  return (
    <div className="adm-row-items">
      {items.slice(0, 4).map((item, i) => {
        const emoji = item.type === 'burger' ? '🍔' : '🍕';
        const name = item.name || capitalize(item.type || 'Item');
        const qty = item.quantity ?? 1;
        const mods = getKeyMods(item);
        return (
          <div key={i} className="adm-row-item">
            <div className="adm-row-item-line">
              <span className="adm-row-item-emoji">{emoji}</span>
              <span className="adm-row-item-name">{name}</span>
              {qty > 1 && <span className="adm-row-item-qty">×{qty}</span>}
            </div>
            {mods.length > 0 && (
              <div className="adm-row-item-mods">
                {mods.map((mod, mi) => (
                  <span key={mi} className="adm-row-item-mod">{mod}</span>
                ))}
              </div>
            )}
          </div>
        );
      })}
      {items.length > 4 && (
        <div className="adm-row-item adm-row-item--more">+{items.length - 4} more</div>
      )}
    </div>
  );
}

const VEHICLE_ICON = { bicycle: '🚲', scooter: '🛵', car: '🚗' };

/* ═══════════════════════════════════════════════════════════
   SMART PIPELINE — interactive workflow tracker
═══════════════════════════════════════════════════════════ */
function SmartPipeline({ order, onStepClick, onDriverAndAdvance, saving, drivers }) {
  const [driverOpen, setDriverOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!driverOpen) return;
    function close(e) { if (!wrapRef.current?.contains(e.target)) setDriverOpen(false); }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [driverOpen]);

  const { status, driver_name } = order;

  const isRmPending =
    status === 'waiting_confirmation' ||
    (status === 'pending' && order.delivery_address?.source === 'restaurant_mode');

  const isWebPending = status === 'pending' && !isRmPending;

  if (isWebPending) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '3px 8px', borderRadius: 6,
          background: 'rgba(99,102,241,0.14)', border: '1px solid rgba(99,102,241,0.35)',
          color: '#4338ca', fontSize: 10, fontWeight: 800, whiteSpace: 'nowrap',
        }}>
          📋 Awaiting Approval
        </span>
        <button
          className="adm-row-btn adm-row-btn--accept"
          style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', fontSize: 10.5, padding: '5px 12px' }}
          onClick={() => !saving && onStepClick(order.id, 'confirmed')}
          disabled={saving}
        >
          ✓ Approve
        </button>
        <button
          className="adm-row-btn adm-row-btn--cancel"
          style={{ fontSize: 10.5, padding: '5px 10px' }}
          onClick={() => !saving && onStepClick(order.id, 'cancelled')}
          disabled={saving}
        >
          ✗ Reject
        </button>
      </div>
    );
  }

  if (isRmPending) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '3px 8px', borderRadius: 6,
          background: 'rgba(234,179,8,0.14)', border: '1px solid rgba(234,179,8,0.35)',
          color: '#854d0e', fontSize: 10, fontWeight: 800, whiteSpace: 'nowrap',
        }}>
          🍽️ Waiting
        </span>
        <button
          className="adm-row-btn adm-row-btn--accept"
          style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', fontSize: 10.5, padding: '5px 12px' }}
          onClick={() => !saving && onStepClick(order.id, 'preparing')}
          disabled={saving}
        >
          👨‍🍳 Send to Kitchen
        </button>
      </div>
    );
  }

  if (status === 'cancelled') {
    return (
      <div className="adm-cpipe-cancelled">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
        Cancelled
      </div>
    );
  }

  const idx = PIPELINE_VALS.indexOf(status);
  const effectiveIdx = idx === -1 ? 0 : idx;

  function handleStepClick(stepIdx, stepValue) {
    if (saving) return;
    if (stepIdx !== effectiveIdx + 1) return;
    if (stepValue === 'ready') {
      setDriverOpen(v => !v);
    } else {
      onStepClick(order.id, stepValue);
    }
  }

  function handleDriverSelect(driver) {
    setDriverOpen(false);
    onDriverAndAdvance(order.id, driver.full_name, 'ready', driver.id);
  }

  return (
    <div className="adm-spipe" ref={wrapRef}>
      <div className="adm-spipe-track">
        {PIPELINE.map((step, i) => {
          const done = i < effectiveIdx;
          const active = i === effectiveIdx;
          const isNext = i === effectiveIdx + 1;
          const clickable = isNext && !saving;

          return (
            <Fragment key={step.value}>
              <div
                className={[
                  'adm-spipe-step',
                  done ? 'adm-spipe-step--done' : '',
                  active ? 'adm-spipe-step--active' : '',
                  isNext ? 'adm-spipe-step--next' : '',
                  clickable ? 'adm-spipe-step--clickable' : '',
                  (step.value === 'ready' && driverOpen) ? 'adm-spipe-step--driver-open' : '',
                ].filter(Boolean).join(' ')}
                onClick={() => handleStepClick(i, step.value)}
                role={clickable ? 'button' : undefined}
                tabIndex={clickable ? 0 : undefined}
              >
                <div className="adm-spipe-dot">
                  {done ? (
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <span className="adm-spipe-icon">{step.icon}</span>
                  )}
                </div>
                <span className="adm-spipe-label">{step.label}</span>
                {step.value === 'ready' && (done || active) && driver_name && (
                  <span className="adm-spipe-driver-badge">🛵 {driver_name}</span>
                )}
              </div>
              {i < PIPELINE.length - 1 && (
                <div className={`adm-spipe-line${done ? ' adm-spipe-line--done' : ''}`} />
              )}
            </Fragment>
          );
        })}
      </div>

      {driverOpen && (
        <div className="adm-spipe-driver-panel">
          <div className="adm-spipe-driver-title">Assign &amp; dispatch</div>
          <div className="adm-spipe-driver-grid">
            {drivers.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--adm-text-3)', padding: '8px 4px', gridColumn: '1/-1' }}>
                No active drivers — add some in Drivers.
              </div>
            ) : drivers.map(d => (
              <button
                key={d.id}
                className={`adm-spipe-driver-opt${order.driver_name === d.full_name ? ' adm-spipe-driver-opt--current' : ''}`}
                onClick={() => handleDriverSelect(d)}
                disabled={saving}
              >
                {VEHICLE_ICON[d.vehicle_type] ?? '🛵'} {d.full_name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ROW ACTIONS — cancel only; pipeline handles forward moves
═══════════════════════════════════════════════════════════ */
function RowActions({ order, onAction, saving }) {
  const canCancel = !['delivered', 'cancelled'].includes(order.status);
  if (!canCancel) return null;
  return (
    <div className="adm-row-actions">
      <button
        className="adm-row-btn adm-row-btn--cancel"
        onClick={() => onAction(order.id, 'cancelled')}
        disabled={saving}
        title="Cancel Order"
        style={{
          background: 'none',
          border: 'none',
          padding: '2px 6px',
          fontSize: 10,
          fontWeight: 500,
          opacity: 0.45,
          cursor: 'pointer',
          color: 'inherit',
          letterSpacing: 0,
        }}
      >
        Cancel
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   INFO PANEL — customer / delivery / items / payment only
═══════════════════════════════════════════════════════════ */
function OrderInfoPanel({ order }) {
  const addr = order.delivery_address || {};
  const items = Array.isArray(order.items) ? order.items : [];

  return (
    <div className="adm-info-panel">

      {/* Three-column info grid */}
      <div className="adm-info-grid">

        {/* Customer */}
        <div className="adm-info-section">
          <div className="adm-info-section-title">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
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
              <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" />
              <circle cx="12" cy="10" r="3" />
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
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
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
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 01-8 0" />
          </svg>
          Ordered Items <span className="adm-info-items-count">({items.length})</span>
        </div>
        {items.length === 0 ? (
          <div className="adm-info-empty">No item data available</div>
        ) : (
          <div className="adm-info-items-list">
            {items.map((item, i) => {
              const customs = getCustomizations(item);
              const qty = item.quantity ?? 1;
              const price = item.price != null ? fmtCurrency(item.price * qty) : null;
              const emoji = item.type === 'burger' ? '🍔' : '🍕';
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
  const navigate = useNavigate();
  const { enterRestaurantMode } = useRestaurantMode();
  const { restaurantStatus, setRestaurantStatus } = useOrdering();
  const [savingStatus, setSavingStatus] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function handleStatusChange(newStatus) {
    if (savingStatus || newStatus === restaurantStatus) return;
    setSavingStatus(true);
    await setRestaurantStatus(newStatus);
    setSavingStatus(false);
  }
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [newIds, setNewIds] = useState(new Set());
  const [savingIds, setSavingIds] = useState(new Set());
  const [successIds, setSuccessIds] = useState(new Set());
  const [muted, setMutedState] = useState(() => getMuted());
  const [activeDrivers, setActiveDrivers] = useState([]);
  const channelRef = useRef(null);
  const ordersRef = useRef([]);
  useEffect(() => { ordersRef.current = orders; }, [orders]);

  useEffect(() => {
    const unlock = () => { unlockAudio(); document.removeEventListener('pointerdown', unlock); };
    document.addEventListener('pointerdown', unlock, { passive: true });
    requestNotificationPermission();
    return () => document.removeEventListener('pointerdown', unlock);
  }, []);

  function handleToggleMute() {
    const nowMuted = toggleMute();
    setMutedState(nowMuted);
    if (!nowMuted) {
      playOrderNotification();
    }
  }

  function addToast(title, text, type = 'new-order', icon = '🛎️') {
    const id = Date.now();
    setToasts(prev => [...prev, { id, title, text, type, icon }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }

  async function load() {
    setLoading(true); setError(null);
    try {
      setOrders(await fetchOrders({ since: getYesterdayStart(), limit: 500 }));
    }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    load();
    fetchActiveDrivers().then(setActiveDrivers).catch(() => { });
    channelRef.current = subscribeToOrders(({ eventType, new: row, old }) => {
      if (eventType === 'INSERT') {
        if (!isInWindow(row.created_at)) return;
        setOrders(prev => [row, ...prev]);
        setNewIds(prev => new Set([...prev, row.id]));
        const notifBody = `${row.customer_name || 'Guest'} · ${fmtCurrency(row.total_price)}`;
        addToast('New Order!', notifBody);
        playOrderNotification();
        showBrowserNotification('🛎️ New Order!', notifBody);
        setTimeout(() => setNewIds(prev => { const n = new Set(prev); n.delete(row.id); return n; }), 6000);
      } else if (eventType === 'UPDATE') {
        setOrders(prev => prev.map(o => o.id === row.id ? row : o));
      } else if (eventType === 'DELETE') {
        setOrders(prev => prev.filter(o => o.id !== old.id));
      }
    }, 'admin-orders-orders');
    return () => { channelRef.current?.unsubscribe(); };
  }, []);

  const handleAction = useCallback(async (id, newStatus) => {
    const original = ordersRef.current.find(o => o.id === id) ?? null;
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
    setSavingIds(prev => new Set([...prev, id]));
    try {
      const updated = await updateOrderStatus(id, newStatus);
      setOrders(prev => prev.map(o => o.id === id ? updated : o));
      setSuccessIds(prev => new Set([...prev, id]));
      setTimeout(() => setSuccessIds(prev => { const n = new Set(prev); n.delete(id); return n; }), 2400);
      const label = STATUS_MAP[newStatus]?.label ?? newStatus;
      const icons = { preparing: '👨‍🍳', ready: '🛵', delivered: '📦', cancelled: '❌' };
      const types = { preparing: 'accept', ready: 'delivery', delivered: 'update', cancelled: 'error' };
      addToast('Status updated', `Order #${id.slice(0, 8).toUpperCase()} → ${label}`, types[newStatus] ?? 'update', icons[newStatus] ?? '📦');
    } catch (err) {
      console.error('[handleAction] status update failed', {
        message: err?.message, code: err?.code,
        hint: err?.hint, details: err?.details,
        id, newStatus,
      });
      if (original) setOrders(prev => prev.map(o => o.id === id ? original : o));
      addToast('Update failed', err?.message ?? 'Please try again', 'error', '❌');
    } finally {
      setSavingIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    }
  }, []);

  const handleDriverAndAdvance = useCallback(async (orderId, driverName, status, driverId) => {
    if (!driverName?.trim()) {
      console.warn('[handleDriverAndAdvance] called with empty driverName — aborting');
      return;
    }
    const current = ordersRef.current.find(o => o.id === orderId);
    if (current && ['delivered', 'cancelled'].includes(current.status)) return;

    const original = current ?? null;
    setOrders(prev => prev.map(o =>
      o.id === orderId ? { ...o, driver_name: driverName.trim(), status } : o
    ));
    setSavingIds(prev => new Set([...prev, orderId]));
    try {
      const updated = await assignDriverAndAdvance(orderId, driverName.trim(), status);
      setOrders(prev => prev.map(o => o.id === orderId ? updated : o));
      setSuccessIds(prev => new Set([...prev, orderId]));
      setTimeout(() => setSuccessIds(prev => { const n = new Set(prev); n.delete(orderId); return n; }), 2400);
      addToast('Driver assigned', `${driverName} is on the way! 🛵`, 'delivery', '🛵');
      if (driverId) createDriverAssignment(orderId, driverId).catch(e => console.warn('[assignment record]', e?.message));
    } catch (err) {
      console.error('[handleDriverAndAdvance] assignment failed', {
        message: err?.message, code: err?.code,
        hint: err?.hint, details: err?.details,
        orderId, driverName, status,
      });
      if (original) setOrders(prev => prev.map(o => o.id === orderId ? original : o));
      addToast(
        'Assignment failed',
        err?.message ?? 'Please try again',
        'error',
        '❌',
      );
    } finally {
      setSavingIds(prev => { const n = new Set(prev); n.delete(orderId); return n; });
    }
  }, []);

  /* Filters */
  const filtered = orders.filter(o => {
    if (!isInWindow(o.created_at)) return false;

    const q = search.toLowerCase();
    const matchSearch = !q ||
      o.id.toLowerCase().includes(q) ||
      (o.customer_name || '').toLowerCase().includes(q) ||
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

  const pendingCount = orders.filter(o =>
    o.status === 'pending' ||
    o.status === 'waiting_confirmation' ||
    (o.status === 'preparing' && o.delivery_address?.source === 'restaurant_mode')
  ).length;

  /* KPI computations */
  const todayStr = new Date().toDateString();
  const todayOrders = orders.filter(o => new Date(o.created_at).toDateString() === todayStr);
  const todayRevenue = todayOrders.reduce((s, o) => s + Number(o.total_price || 0), 0);
  const activeCount = orders.filter(o => ['confirmed', 'preparing', 'ready'].includes(o.status)).length;

  return (
    <>
      <Toast toasts={toasts} />

      {/* ══════════════════════════════════════
          PAGE HEADER
      ══════════════════════════════════════ */}
      <div className="adm-page-header">
        <div className="adm-page-header-left">
          <h1 className="adm-page-title">
            Orders
            {pendingCount > 0 && (
              <span className="ord-pending-badge">{pendingCount}</span>
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

        <button
          className="adm-btn adm-btn--ghost adm-notif-btn"
          onClick={handleToggleMute}
          title={muted ? 'Unmute order sounds' : 'Mute order sounds'}
          style={{ height: 38, fontSize: 12, minWidth: 38, padding: '0 12px' }}
        >
          {muted ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13.73 21a2 2 0 01-3.46 0" /><path d="M18.63 13A17.89 17.89 0 0118 8" />
              <path d="M6.26 6.26A5.86 5.86 0 006 8c0 7-3 9-3 9h14" /><path d="M18 8a6 6 0 00-9.33-5" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
          )}
          <span style={{ marginLeft: 5 }}>{muted ? 'Muted' : 'Sound'}</span>
        </button>

        <div className="adm-orders-status-seg" role="group" aria-label="Restaurant status">
          {[
            { value: 'online', label: 'Online' },
            { value: 'busy', label: 'Busy' },
            { value: 'closed', label: 'Closed' },
          ].map(opt => (
            <button
              key={opt.value}
              className={`adm-orders-seg-btn adm-orders-seg-btn--${opt.value}${restaurantStatus === opt.value ? ' adm-orders-seg-btn--active' : ''}`}
              onClick={() => handleStatusChange(opt.value)}
              disabled={savingStatus || restaurantStatus === opt.value}
              aria-pressed={restaurantStatus === opt.value}
            >
              <span className="adm-orders-seg-dot" />
              {opt.label}
            </button>
          ))}
        </div>

        <button className="adm-btn adm-btn--ghost" onClick={load} style={{ height: 38, fontSize: 12 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
          </svg>
          Refresh
        </button>

        <button
          className="adm-btn adm-btn--primary"
          onClick={() => enterRestaurantMode(navigate)}
          style={{ height: 38, fontSize: 12, gap: 7 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          Restaurant Mode
        </button>
      </div>

      {/* ══════════════════════════════════════
          KPI STAT CARDS
      ══════════════════════════════════════ */}
      <div className="ord-kpi-grid">
        <div className="ord-kpi-card ord-kpi-card--amber">
          <div className="ord-kpi-top">
            <span className="ord-kpi-icon">🛒</span>
            <span className="ord-kpi-label">Orders Today</span>
          </div>
          <div className="ord-kpi-value">{todayOrders.length}</div>
        </div>
        <div className="ord-kpi-card ord-kpi-card--green">
          <div className="ord-kpi-top">
            <span className="ord-kpi-icon">💶</span>
            <span className="ord-kpi-label">Revenue Today</span>
          </div>
          <div className="ord-kpi-value">{fmtCurrency(todayRevenue)}</div>
        </div>
        <div className="ord-kpi-card ord-kpi-card--orange">
          <div className="ord-kpi-top">
            <span className="ord-kpi-icon">⏳</span>
            <span className="ord-kpi-label">Awaiting Action</span>
          </div>
          <div className="ord-kpi-value">{pendingCount}</div>
        </div>
        <div className="ord-kpi-card ord-kpi-card--blue">
          <div className="ord-kpi-top">
            <span className="ord-kpi-icon">🛵</span>
            <span className="ord-kpi-label">Active Orders</span>
          </div>
          <div className="ord-kpi-value">{activeCount}</div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          FILTER / SEARCH BAR
      ══════════════════════════════════════ */}
      <div className="ord-filter-bar">
        <div className="ord-search-wrap">
          <svg className="ord-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="adm-search ord-search-input"
            type="text"
            placeholder="Search by name, ID, email or phone…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
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
        {!loading && (
          <span className="ord-filter-count">
            {filtered.length} / {orders.length}
          </span>
        )}
      </div>

      {error && (
        <div className="adm-card" style={{ marginBottom: 14, color: 'var(--adm-red)', fontSize: 13, padding: '12px 18px' }}>
          Failed to load orders: {error}
        </div>
      )}

      {/* ══════════════════════════════════════
          ORDER CARDS GRID
      ══════════════════════════════════════ */}
      {loading ? (
        /* ── Skeleton placeholders ── */
        <div className="ord-grid">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="ord-card ord-card--loading">
              {/* cap */}
              <div className="ord-cap">
                <div className="adm-skeleton" style={{ width: 90, height: 18, borderRadius: 8 }} />
                <div className="adm-skeleton" style={{ width: 44, height: 13, borderRadius: 6 }} />
              </div>
              {/* hero */}
              <div className="ord-hero">
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
                  <div className="adm-skeleton" style={{ width: '65%', height: 22, borderRadius: 8 }} />
                  <div className="adm-skeleton" style={{ width: '40%', height: 13, borderRadius: 6 }} />
                </div>
                <div className="adm-skeleton" style={{ width: 64, height: 26, borderRadius: 8 }} />
              </div>
              <div className="ord-sep" />
              {/* items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                <div className="adm-skeleton" style={{ width: '75%', height: 13, borderRadius: 6 }} />
                <div className="adm-skeleton" style={{ width: '55%', height: 13, borderRadius: 6 }} />
              </div>
              <div className="ord-sep" />
              {/* pipeline placeholder */}
              <div className="adm-skeleton" style={{ width: '100%', height: 52, borderRadius: 14 }} />
              <div className="ord-sep" />
              {/* footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div className="adm-skeleton" style={{ width: 80, height: 30, borderRadius: 8 }} />
                <div className="adm-skeleton" style={{ width: 70, height: 30, borderRadius: 8 }} />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="adm-card">
          <div className="adm-empty">
            <div className="adm-empty-emoji">📭</div>
            <div className="adm-empty-title">No orders found</div>
            <div className="adm-empty-sub">Try adjusting your search or filters.</div>
          </div>
        </div>
      ) : (
        <div className="ord-grid" style={{ gap: 6 }}>
          {filtered.map(o => {
            const statusInfo = STATUS_MAP[o.status];
            return (
              <div
                key={o.id}
                className={[
                  'ord-card',
                  newIds.has(o.id) ? 'ord-card--new' : '',
                  successIds.has(o.id) ? 'ord-card--success' : '',
                  expandedId === o.id ? 'ord-card--expanded' : '',
                ].filter(Boolean).join(' ')}
                data-status={o.status}
              >

                {/* ── Cap: status + time ── */}
                <div className="ord-cap" style={{ paddingTop: 8, paddingBottom: 6 }}>
                  <div className="ord-cap-left">
                    <span className="ord-status-dot" style={{ background: statusInfo?.color ?? '#9ca3af' }} />
                    <span className="ord-status-label">{statusInfo?.label ?? capitalize(o.status)}</span>
                    {newIds.has(o.id) && <span className="adm-orow-new-tag">NEW</span>}
                  </div>
                  <span className="ord-cap-time">{timeAgo(o.created_at)}</span>
                </div>

                {/* ── Restaurant mode pills ── */}
                {((o.source === 'restaurant_mode') || (o.delivery_address?.source === 'restaurant_mode')) && (() => {
                  const addr = o.delivery_address || {};
                  const orderType = o.order_type || addr.order_type || addr.mode || '';
                  const tableNum = o.table_number || addr.table_number || addr.tableNumber || '';
                  const payMethod = o.payment_method || addr.payment || '';
                  return (
                    <div className="ord-rm-row">
                      <span className="ord-rm-badge">🍽️ Restaurant</span>
                      {orderType && <span className="ord-rm-meta">{orderType.replace(/_/g, '-')}</span>}
                      {tableNum && <span className="ord-rm-tag">Table {tableNum}</span>}
                      {payMethod && <span className="ord-rm-meta">{payMethod === 'card_in_store' ? '💳 Card' : '💵 Cash'}</span>}
                    </div>
                  );
                })()}

                {/* ── Hero: customer name + price ── */}
                <div className="ord-hero" style={{ paddingBottom: 6 }}>
                  <div className="ord-hero-info">
                    <div className="ord-customer-name">{o.customer_name || '—'}</div>
                    <div className="ord-order-id">#{o.id.slice(0, 8).toUpperCase()}</div>
                  </div>
                  <div className="ord-price">{fmtCurrency(o.total_price)}</div>
                </div>

                <div className="ord-sep" />

                {/* ── Items ── */}
                <div className="ord-items-wrap" style={{ paddingTop: 6, paddingBottom: 6 }}>
                  <InlineOrderItems items={o.items} />
                </div>

                <div className="ord-sep" />

                {/* ── Workflow / Pipeline ── */}
                <div className="ord-workflow" style={{ paddingTop: 6, paddingBottom: 6 }}>
                  <SmartPipeline
                    order={o}
                    onStepClick={handleAction}
                    onDriverAndAdvance={handleDriverAndAdvance}
                    saving={savingIds.has(o.id)}
                    drivers={activeDrivers}
                  />
                </div>

                <div className="ord-sep" />

                {/* ── Footer: expand details + cancel ── */}
                <div className="ord-footer" style={{ paddingTop: 6, paddingBottom: 8 }}>
                  <button
                    className={`ord-details-btn${expandedId === o.id ? ' ord-details-btn--open' : ''}`}
                    onClick={() => setExpandedId(prev => prev === o.id ? null : o.id)}
                    aria-label="Toggle order details"
                    aria-expanded={expandedId === o.id}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    Details
                    <svg
                      className="ord-details-chevron"
                      width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                      style={{ transform: expandedId === o.id ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  <div className="ord-footer-actions">
                    <RowActions
                      order={o}
                      onAction={handleAction}
                      saving={savingIds.has(o.id)}
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
            );
          })}
        </div>
      )}
    </>
  );
}
