import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchOrders, updateOrderStatus, subscribeToOrders, assignDriverAndAdvance, fetchActiveDrivers, createDriverAssignment } from '../services/adminService';
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
import { SIZES_BY_ID } from '../../utils/pizzaSizes';

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
// Lower bound (inclusive) for the selected date-filter dropdown value, in
// local time. Returns null for 'all' (no date filter — fetchOrders skips
// the .gte() clause entirely). No upper bound is needed for any option
// since there are never future orders.
function sinceForDateFilter(filter) {
  const now = new Date();
  switch (filter) {
    case 'today': {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case 'last7': {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      return d;
    }
    case 'last30': {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      return d;
    }
    case 'thisMonth':
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case 'thisYear':
      return new Date(now.getFullYear(), 0, 1);
    case 'all':
    default:
      return null;
  }
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
    if (item.size && SIZES_BY_ID[item.size]) rows.push({ label: 'Size', value: SIZES_BY_ID[item.size].label });
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

  /* Restaurant mode: show "Send to Kitchen" CTA before pipeline starts.
     Works with status='waiting_confirmation' (after migration 007)
     AND with status='pending' + delivery_address.source='restaurant_mode' (before migration). */
  const isRmPending =
    status === 'waiting_confirmation' ||
    (status === 'pending' && order.delivery_address?.source === 'restaurant_mode');

  /* Regular web order awaiting admin approval → show Approve / Reject */
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
   CANCEL CONFIRM MODAL
   Deliberate-intent gate — prevents accidental cancellations.
═══════════════════════════════════════════════════════════ */
function CancelConfirmModal({ order, onConfirm, onDismiss }) {
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onDismiss(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onDismiss}
        style={{
          position: 'fixed', inset: 0, zIndex: 9000,
          background: 'rgba(10,5,0,0.46)',
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)',
        }}
      />
      {/* Dialog */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9001,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20, pointerEvents: 'none',
      }}>
        <div
          onClick={e => e.stopPropagation()}
          style={{
            pointerEvents: 'auto',
            background: 'var(--adm-card-bg)',
            border: '1.5px solid var(--adm-border)',
            borderRadius: 20,
            padding: '26px 26px 22px',
            width: '100%', maxWidth: 340,
            boxShadow:
              '0 4px 16px rgba(0,0,0,0.14), 0 16px 48px rgba(0,0,0,0.20), 0 40px 80px rgba(0,0,0,0.14)',
          }}
        >
          {/* Icon */}
          <div style={{
            width: 46, height: 46, borderRadius: 13,
            background: 'rgba(239,68,68,0.10)',
            border: '1.5px solid rgba(239,68,68,0.24)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 16,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          {/* Heading */}
          <div style={{
            fontFamily: 'Nunito, sans-serif', fontWeight: 900,
            fontSize: 15.5, color: 'var(--adm-text)', marginBottom: 7, lineHeight: 1.2,
          }}>
            Cancel this order?
          </div>
          {/* Body */}
          <div style={{
            fontFamily: 'Nunito, sans-serif', fontSize: 12.5, fontWeight: 600,
            color: 'var(--adm-text-2)', lineHeight: 1.60, marginBottom: 22,
          }}>
            Order{' '}
            <span style={{ fontWeight: 800, color: 'var(--adm-text)' }}>
              #{order.id.slice(0, 8).toUpperCase()}
            </span>
            {order.customer_name && (
              <> from{' '}
                <span style={{ fontWeight: 800, color: 'var(--adm-text)' }}>
                  {order.customer_name}
                </span>
              </>
            )}
            {' '}will be permanently cancelled. This cannot be undone.
          </div>
          {/* Buttons — Keep is primary, Cancel Order is destructive secondary */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={onDismiss}
              autoFocus
              style={{
                flex: 1, padding: '10px 14px', borderRadius: 11,
                border: '1.5px solid var(--adm-border)',
                background: 'var(--adm-surface-3)',
                fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 13,
                color: 'var(--adm-text)', cursor: 'pointer', lineHeight: 1,
              }}
            >
              Keep Order
            </button>
            <button
              type="button"
              onClick={onConfirm}
              style={{
                flex: 1, padding: '10px 14px', borderRadius: 11,
                border: '1.5px solid rgba(239,68,68,0.38)',
                background: 'rgba(239,68,68,0.08)',
                fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: 13,
                color: '#dc2626', cursor: 'pointer', lineHeight: 1,
              }}
            >
              Cancel Order
            </button>
          </div>
        </div>
      </div>
    </>
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
  // Always starts on "Today" — deliberately not persisted anywhere (no
  // localStorage/URL sync), so plain component state already resets to this
  // default on every mount: refresh, re-login, or navigating back to the page.
  const [dateFilter, setDateFilter] = useState('today');
  const [expandedId, setExpandedId] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [newIds, setNewIds] = useState(new Set());
  const [savingIds, setSavingIds] = useState(new Set());
  const [successIds, setSuccessIds] = useState(new Set());
  const [muted, setMutedState] = useState(() => getMuted());
  const [activeDrivers, setActiveDrivers] = useState([]);
  const [confirmCancel, setConfirmCancel] = useState(null);
  const channelRef = useRef(null);
  const listRef    = useRef(null);
  // Always-current orders snapshot for optimistic-UI rollback without stale closures
  const ordersRef = useRef([]);
  useEffect(() => { ordersRef.current = orders; }, [orders]);

  // Cursor-following glass reflection — sets --card-x / --card-y on each hovered row
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const onMove = (e) => {
      const row = e.target.closest('.adm-orow');
      if (!row) return;
      const r = row.getBoundingClientRect();
      row.style.setProperty('--card-x', `${((e.clientX - r.left) / r.width  * 100).toFixed(1)}%`);
      row.style.setProperty('--card-y', `${((e.clientY - r.top)  / r.height * 100).toFixed(1)}%`);
    };
    list.addEventListener('mousemove', onMove, { passive: true });
    return () => list.removeEventListener('mousemove', onMove);
  }, []);

  // Unlock audio + request browser notification permission on first admin interaction
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
      // Play a preview ding so admin knows sound is on
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
      const since = sinceForDateFilter(dateFilter);
      setOrders(await fetchOrders({ since: since ? since.toISOString() : null, limit: 500 }));
    }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  // Refetch whenever the date-filter dropdown changes (also fires on mount).
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilter]);

  // Realtime subscription + drivers — set up once on mount only, so
  // changing the date filter never tears down/recreates the channel.
  useEffect(() => {
    fetchActiveDrivers().then(setActiveDrivers).catch(() => { });
    channelRef.current = subscribeToOrders(({ eventType, new: row, old }) => {
      if (eventType === 'INSERT') {
        // A newly-inserted order's created_at is always "now", which
        // satisfies every date filter's lower bound (none has an upper
        // bound), so it's always shown regardless of the selected range.
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
    // Capture snapshot for rollback before any state mutation
    const original = ordersRef.current.find(o => o.id === id) ?? null;
    // Optimistic: reflect new status immediately
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
      // Rollback optimistic update
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
    // Guard: never assign driver to a finished order
    const current = ordersRef.current.find(o => o.id === orderId);
    if (current && ['delivered', 'cancelled'].includes(current.status)) return;

    // Capture snapshot for rollback
    const original = current ?? null;
    // Optimistic: show driver name + new status immediately
    setOrders(prev => prev.map(o =>
      o.id === orderId ? { ...o, driver_name: driverName.trim(), status } : o
    ));
    setSavingIds(prev => new Set([...prev, orderId]));
    try {
      const updated = await assignDriverAndAdvance(orderId, driverName.trim(), status);
      // Confirm with server truth
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
      // Rollback optimistic update to pre-assignment state
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

  /* Filters — date range is already applied server-side by load() via the
     dateFilter-driven `since` fetch; only search + status filter client-side. */
  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      o.id.toLowerCase().includes(q) ||
      (o.customer_name || '').toLowerCase().includes(q) ||
      (o.customer_email || '').toLowerCase().includes(q) ||
      (o.customer_phone || '').includes(q);
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const pendingCount = orders.filter(o =>
    o.status === 'pending' ||
    o.status === 'waiting_confirmation' ||
    (o.status === 'preparing' && o.delivery_address?.source === 'restaurant_mode')
  ).length;

  return (
    <>
      <Toast toasts={toasts} />
      {confirmCancel && (
        <CancelConfirmModal
          order={confirmCancel}
          onConfirm={() => { handleAction(confirmCancel.id, 'cancelled'); setConfirmCancel(null); }}
          onDismiss={() => setConfirmCancel(null)}
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
            Live restaurant delivery management
            <span className="adm-live-indicator">
              <span className="adm-live-dot" />
              LIVE
            </span>
          </p>
        </div>
        {/* Mute / unmute order sounds */}
        <button
          className="adm-btn adm-btn--ghost adm-notif-btn"
          onClick={handleToggleMute}
          title={muted ? 'Unmute order sounds' : 'Mute order sounds'}
          style={{ height: 38, fontSize: 12, minWidth: 38, padding: '0 12px' }}
        >
          {muted ? (
            /* Bell off */
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13.73 21a2 2 0 01-3.46 0" /><path d="M18.63 13A17.89 17.89 0 0118 8" />
              <path d="M6.26 6.26A5.86 5.86 0 006 8c0 7-3 9-3 9h14" /><path d="M18 8a6 6 0 00-9.33-5" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          ) : (
            /* Bell */
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
          )}
          <span style={{ marginLeft: 5 }}>{muted ? 'Muted' : 'Sound'}</span>
        </button>

        {/* 3-state restaurant status */}
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
          Open Restaurant Mode
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
          <option value="last7">Last 7 days</option>
          <option value="last30">Last 30 days</option>
          <option value="thisMonth">This month</option>
          <option value="thisYear">This year</option>
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
            {orders.length === 0 && dateFilter === 'all' && statusFilter === 'all' && !search ? (
              <>
                <div className="adm-empty-title">No orders returned</div>
                <div className="adm-empty-sub">
                  This is an unfiltered "All time" query with no search or status
                  filter — if you know orders exist in Supabase, check the RLS
                  policies on <code>orders</code> (Dashboard → Authentication →
                  Policies) against migrations <code>002_products_orders.sql</code>
                  {' '}and <code>014_orders_status_protection.sql</code>. A live
                  insert test showed the deployed policies may not match those
                  files, which would make this request succeed with no error
                  while silently returning zero rows.
                </div>
              </>
            ) : (
              <>
                <div className="adm-empty-title">No orders found</div>
                <div className="adm-empty-sub">Try adjusting search or filters.</div>
              </>
            )}
          </div>
        ) : (
          <div className="adm-orders-list" ref={listRef}>
            {filtered.map(o => (
              <Fragment key={o.id}>
                <div
                  className={[
                    'adm-orow',
                    'adm-orow--order-page',
                    newIds.has(o.id) ? 'adm-orow--new' : '',
                    successIds.has(o.id) ? 'adm-orow--success' : '',
                    expandedId === o.id ? 'adm-orow--open' : '',
                  ].filter(Boolean).join(' ')}
                >


                  {/* ── Main 3-column row ── */}
                  <div className="adm-orow-main">

                    {/* LEFT: order meta */}
                    <div className="adm-orow-left">
                      <div className="adm-orow-topline">
                        <div className="adm-orow-id">
                          #{o.id.slice(0, 8).toUpperCase()}
                          {newIds.has(o.id) && <span className="adm-orow-new-tag">NEW</span>}
                        </div>
                        <span className="adm-orow-time">{timeAgo(o.created_at)}</span>
                      </div>

                      {/* Restaurant Mode metadata row
                          Reads from delivery_address JSONB (works before migration 007)
                          and falls back to dedicated columns (works after migration 007) */}
                      {((o.source === 'restaurant_mode') || (o.delivery_address?.source === 'restaurant_mode')) && (() => {
                        const addr = o.delivery_address || {};
                        const orderType = o.order_type || addr.order_type || addr.mode || '';
                        const tableNum = o.table_number || addr.table_number || addr.tableNumber || '';
                        const payMethod = o.payment_method || addr.payment || '';
                        return (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', margin: '2px 0 3px' }}>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 3,
                              padding: '2px 7px', borderRadius: 5,
                              background: 'rgba(255,213,74,0.16)', border: '1px solid rgba(255,213,74,0.38)',
                              color: 'var(--adm-accent-text)', fontSize: 9.5, fontWeight: 800,
                            }}>
                              🍽️ Restaurant
                            </span>
                            {orderType && (
                              <span style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--adm-text-3)', textTransform: 'capitalize' }}>
                                {orderType.replace(/_/g, '-')}
                              </span>
                            )}
                            {tableNum && (
                              <span style={{
                                padding: '2px 6px', borderRadius: 4,
                                background: 'var(--adm-surface-4)', border: '1px solid var(--adm-border)',
                                fontSize: 9.5, fontWeight: 800, color: 'var(--adm-text-2)',
                              }}>
                                Table {tableNum}
                              </span>
                            )}
                            {payMethod && (
                              <span style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--adm-text-3)' }}>
                                {payMethod === 'card_in_store' ? '💳 Card' : '💵 Cash'}
                              </span>
                            )}
                          </div>
                        );
                      })()}

                      <div className="adm-orow-name-row">
                        <div className="adm-orow-customer">{o.customer_name || '—'}</div>
                        <div className="adm-orow-total">{fmtCurrency(o.total_price)}</div>
                      </div>
                      <InlineOrderItems items={o.items} />
                    </div>

                    {/* RIGHT: pipeline + info + cancel on one row */}
                    <div className="adm-orow-right">
                      <div className="adm-pipe-info-row">
                        <SmartPipeline
                          order={o}
                          onStepClick={handleAction}
                          onDriverAndAdvance={handleDriverAndAdvance}
                          saving={savingIds.has(o.id)}
                          drivers={activeDrivers}
                        />
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                          <button
                            className={`adm-info-btn adm-info-btn--mini${expandedId === o.id ? ' adm-info-btn--open' : ''}`}
                            onClick={() => setExpandedId(prev => prev === o.id ? null : o.id)}
                            aria-label="Toggle order details"
                            aria-expanded={expandedId === o.id}
                          >
                            Info
                            <svg
                              width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                              style={{ transition: 'transform 0.22s ease', transform: expandedId === o.id ? 'rotate(180deg)' : 'rotate(0deg)' }}
                            >
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                          </button>
                          {!['delivered', 'cancelled'].includes(o.status) && (
                            <button
                              type="button"
                              onClick={() => setConfirmCancel(o)}
                              disabled={savingIds.has(o.id)}
                              title="Cancel order"
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                padding: '5px 9px', borderRadius: 7,
                                border: '1.5px solid rgba(239,68,68,0.28)',
                                background: 'transparent',
                                color: '#dc2626', fontSize: 10.5, fontWeight: 800,
                                cursor: 'pointer', whiteSpace: 'nowrap',
                                fontFamily: 'inherit',
                                opacity: savingIds.has(o.id) ? 0.45 : 1,
                                transition: 'background 0.14s ease, border-color 0.14s ease',
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.background = 'rgba(239,68,68,0.07)';
                                e.currentTarget.style.borderColor = 'rgba(239,68,68,0.44)';
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.borderColor = 'rgba(239,68,68,0.28)';
                              }}
                            >
                              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
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
