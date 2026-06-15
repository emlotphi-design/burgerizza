import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../services/supabase';
import { fetchOrders, getYesterdayStart, updateOrderStatus } from '../admin/services/adminService';
import {
  getMuted,
  playOrderNotification,
  toggleMute,
  unlockAudio,
} from '../utils/playOrderNotification';
import {
  BUN_BASES, BUN_TOPS, BUN_BASE_WIDTH, DEFAULT_WRAPPER,
  MEAT_BASES, MEAT_PREVIEWS,
  CHEESE_BASES, CHEESE_PREVIEWS,
  SAUCE_BASES, SAUCE_PREVIEWS,
  VEGETABLE_BASES, VEGETABLE_PREVIEWS,
  BUN_PREVIEWS,
} from '../features/burger/utils/burgerImages';
import {
  trayImg,
  PIZZA_DOUGHS,
  PIZZA_SAUCES,
  PIZZA_CHEESES,
  PIZZA_MEATS,
  PIZZA_VEGETABLES,
} from './kdsImages';
import './kitchen.css';

/* ── Column configuration ────────────────────────────────────── */
const COLUMNS = [
  {
    key:      'new',
    label:    'New',
    icon:     '🔥',
    statuses: ['confirmed'],
    sort:     'desc',
  },
  {
    key:      'prep',
    label:    'Preparing',
    icon:     '🍳',
    statuses: ['preparing'],
    sort:     'asc',
  },
  {
    key:      'ready',
    label:    'Ready',
    icon:     '✓',
    statuses: ['ready'],
    sort:     'asc',
  },
  {
    key:      'done',
    label:    'Done',
    icon:     '✔',
    statuses: ['completed', 'delivered', 'cancelled'],
    sort:     'desc',
    limit:    20,
  },
];

const KITCHEN_STATUSES = ['confirmed', 'preparing', 'ready'];
const DONE_STATUSES    = ['completed', 'delivered', 'cancelled'];
const ALL_SHOWN        = [...KITCHEN_STATUSES, ...DONE_STATUSES];

const NEXT_STATUS = {
  confirmed: 'preparing',
  preparing: 'ready',
  ready:     'completed',
};

/* ── Pure helpers ────────────────────────────────────────────── */
function getMinutes(iso) {
  return Math.floor((Date.now() - new Date(iso)) / 60000);
}

function urgencyKey(iso, status) {
  if (!KITCHEN_STATUSES.includes(status)) return 'none';
  const m = getMinutes(iso);
  if (m < 5)  return 'fresh';
  if (m < 12) return 'warn';
  return 'late';
}

function formatAge(iso) {
  const m = getMinutes(iso);
  if (m < 1)  return 'Just now';
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

function orderTypeInfo(order) {
  if (order.table_number) return { icon: '🍽️', label: `Table ${order.table_number}` };
  const src = order.source ?? order.delivery_address?.source ?? '';
  if (src === 'pos' || src === 'restaurant_mode') return { icon: '🏪', label: 'In-store' };
  if (order.order_type === 'pickup')   return { icon: '🏃', label: 'Pickup' };
  if (order.order_type === 'delivery' || order.delivery_address?.street)
    return { icon: '🛵', label: 'Delivery' };
  return { icon: '📦', label: 'Order' };
}

function getDisplayId(id) {
  if (!id) return '#000';
  if (typeof id === 'number') return `#${String(id).slice(-3).padStart(3, '0')}`;
  const n = String(id);
  let h = 0;
  for (let i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) & 0xffffffff;
  return `#${String(Math.abs(h % 900) + 100).padStart(3, '0')}`;
}

function cap(s) {
  return s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : '';
}

/* ── Pizza composite ─────────────────────────────────────────── */
function PizzaComposite({ item, size }) {
  const s     = size;
  const dough = PIZZA_DOUGHS[item.dough];
  const sauce = PIZZA_SAUCES[item.sauce];
  const chz   = PIZZA_CHEESES[item.cheese];
  const meats = (item.meats ?? []).map(id => ({ id, ...PIZZA_MEATS[id] })).filter(m => m.layer);
  const vegs  = (item.vegetables ?? []).map(id => ({ id, ...PIZZA_VEGETABLES[id] })).filter(v => v.layer);
  if (!dough && !sauce && !chz && !meats.length && !vegs.length) return null;
  function px(pct) { return Math.round(s * pct / 100); }
  function centered(sizePct, zIndex, offsetPct = 0) {
    const dim = px(sizePct);
    return {
      position: 'absolute', top: '50%', left: '50%',
      transform: offsetPct
        ? `translate(-50%, calc(-50% + ${px(offsetPct)}px))`
        : 'translate(-50%, -50%)',
      width: dim, height: dim, objectFit: 'contain', zIndex, pointerEvents: 'none',
    };
  }
  return (
    <div className="kds-composite kds-composite--pizza" style={{ width: s, height: s }}>
      <img src={trayImg} alt="" style={centered(54, 1)} />
      {dough && <img src={dough.full}  alt="" style={centered(49, 2)} />}
      {sauce && <img src={sauce.layer} alt="" style={centered(sauce.layerPct ?? 42, 3)} />}
      {chz   && <img src={chz.layer}   alt="" style={centered(40, 4, chz.offsetPct ?? 0)} />}
      {meats.map((m, i) => <img key={m.id} src={m.layer} alt="" style={centered(m.layerPct ?? 42, 5 + i)} />)}
      {vegs.map((v, i)  => <img key={v.id} src={v.layer} alt="" style={centered(v.layerPct ?? 42, 5 + meats.length + i, v.offsetPct ?? 0)} />)}
    </div>
  );
}

/* ── Burger composite ────────────────────────────────────────── */
function BurgerComposite({ item, size }) {
  const s       = size;
  const bunId   = item.bun;
  const bunBase = BUN_BASES[bunId];
  const bunTop  = BUN_TOPS[bunId];
  if (!bunBase) return null;
  const bunPct = BUN_BASE_WIDTH[bunId] ?? 36;
  function centered(widthPct, zIndex) {
    const dim = Math.round(s * widthPct / 100);
    return {
      position: 'absolute', top: '50%', left: '50%',
      transform: 'translate(-50%, -50%)',
      width: dim, height: dim, objectFit: 'contain', zIndex, pointerEvents: 'none',
    };
  }
  const layers = [];
  let z = 2;
  if (item.burger_meats && typeof item.burger_meats === 'object')
    Object.entries(item.burger_meats).filter(([, q]) => q > 0).forEach(([id]) => { const src = MEAT_BASES[id]; if (src) layers.push({ id, src, z: z++, pct: bunPct }); });
  if (item.cheeses && typeof item.cheeses === 'object')
    Object.entries(item.cheeses).filter(([, q]) => q > 0).forEach(([id]) => { const src = CHEESE_BASES[id]; if (src) layers.push({ id, src, z: z++, pct: bunPct }); });
  (item.sauces ?? []).forEach(id => { const src = SAUCE_BASES[id]; if (src) layers.push({ id, src, z: z++, pct: bunPct }); });
  (item.vegetables ?? []).forEach(id => { const src = VEGETABLE_BASES[id]; if (src) layers.push({ id, src, z: z++, pct: bunPct }); });
  return (
    <div className="kds-composite kds-composite--burger" style={{ width: s, height: s }}>
      <img src={DEFAULT_WRAPPER} alt="" style={{ ...centered(100, 0), objectFit: 'cover', opacity: 0.22 }} />
      <img src={bunBase} alt="" style={centered(bunPct, 1)} />
      {layers.map(l => <img key={l.id} src={l.src} alt="" style={centered(l.pct, l.z)} />)}
      {bunTop && <img src={bunTop} alt="" style={centered(bunPct, 100)} />}
    </div>
  );
}

/* ── Ingredient chips ────────────────────────────────────────── */
function IngredientChips({ item }) {
  const chips = [];
  if (item.type === 'pizza' || item.dough) {
    const d = PIZZA_DOUGHS[item.dough];    if (d) chips.push({ img: d.preview,   label: d.label });
    const s = PIZZA_SAUCES[item.sauce];   if (s) chips.push({ img: s.preview,   label: s.label });
    const c = PIZZA_CHEESES[item.cheese]; if (c) chips.push({ img: c.preview,   label: c.label });
    (item.meats      ?? []).forEach(id => { const m = PIZZA_MEATS[id];      if (m) chips.push({ img: m.preview, label: m.label }); });
    (item.vegetables ?? []).forEach(id => { const v = PIZZA_VEGETABLES[id]; if (v) chips.push({ img: v.preview, label: v.label }); });
  } else if (item.type === 'burger' || item.bun) {
    const bp = BUN_PREVIEWS[item.bun]; if (bp) chips.push({ img: bp, label: cap(item.bun?.replace(/bun\d?$/, '') || item.bun) });
    if (item.burger_meats && typeof item.burger_meats === 'object')
      Object.entries(item.burger_meats).filter(([, q]) => q > 0).forEach(([id, qty]) => { const p = MEAT_PREVIEWS[id]; if (p) chips.push({ img: p, label: `${cap(id)}${qty > 1 ? ` ×${qty}` : ''}` }); });
    if (item.cheeses && typeof item.cheeses === 'object')
      Object.entries(item.cheeses).filter(([, q]) => q > 0).forEach(([id, qty]) => { const p = CHEESE_PREVIEWS[id]; if (p) chips.push({ img: p, label: `${cap(id)}${qty > 1 ? ` ×${qty}` : ''}` }); });
    (item.sauces     ?? []).forEach(id => { const p = SAUCE_PREVIEWS[id];     if (p) chips.push({ img: p, label: cap(id) }); });
    (item.vegetables ?? []).forEach(id => { const p = VEGETABLE_PREVIEWS[id]; if (p) chips.push({ img: p, label: cap(id) }); });
  }
  if (!chips.length) return null;
  return (
    <div className="kds-chips">
      {chips.map((chip, i) => (
        <div key={i} className="kds-chip">
          <img src={chip.img} alt={chip.label} className="kds-chip-img" />
          <span className="kds-chip-label">{chip.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Timer ───────────────────────────────────────────────────── */
function Timer({ iso, urgency }) {
  if (urgency === 'none') return null;
  return (
    <span className={`kds-timer kds-timer--${urgency}`}>
      {formatAge(iso)}
    </span>
  );
}

/* ── StatusBadge ─────────────────────────────────────────────── */
function StatusBadge({ order }) {
  const { icon, label } = orderTypeInfo(order);
  return <span className="kds-type-badge">{icon} {label}</span>;
}

/* ── ActionBar ───────────────────────────────────────────────── */
function ActionBar({ order, onAdvance, onCancel, busy }) {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const timerRef = useRef(null);

  function handleCancelClick() {
    if (confirmCancel) {
      clearTimeout(timerRef.current);
      onCancel(order.id);
      setConfirmCancel(false);
    } else {
      setConfirmCancel(true);
      timerRef.current = setTimeout(() => setConfirmCancel(false), 4000);
    }
  }

  const isDone = DONE_STATUSES.includes(order.status);

  if (isDone) {
    const isCancel = order.status === 'cancelled';
    return (
      <div className="kds-action-bar">
        <span className={`kds-done-badge kds-done-badge--${isCancel ? 'cancel' : 'complete'}`}>
          {isCancel ? '✕ Cancelled' : '✓ Done'}
        </span>
      </div>
    );
  }

  const btnClass  = order.status === 'confirmed' ? 'start' : order.status === 'preparing' ? 'ready' : 'complete';
  const btnLabel  = order.status === 'confirmed' ? '▶ Start Preparing'
    : order.status === 'preparing'               ? '✓ Mark Ready'
    :                                              '✔ Complete';

  if (confirmCancel) {
    return (
      <div className="kds-action-bar" onClick={e => e.stopPropagation()}>
        <button className="kds-btn kds-btn--cancel-confirm" onClick={handleCancelClick}>Cancel order?</button>
        <button className="kds-btn kds-btn--keep" onClick={() => { clearTimeout(timerRef.current); setConfirmCancel(false); }}>Keep</button>
      </div>
    );
  }

  return (
    <div className="kds-action-bar" onClick={e => e.stopPropagation()}>
      <button
        className={`kds-btn kds-btn--advance kds-btn--${btnClass}`}
        onClick={() => !busy && onAdvance(order.id, NEXT_STATUS[order.status])}
        disabled={busy}
      >
        {busy ? '…' : btnLabel}
      </button>
      <button className="kds-btn kds-btn--cancel" onClick={handleCancelClick} title="Cancel order">✕</button>
    </div>
  );
}

/* ── KitchenCard ─────────────────────────────────────────────── */
function KitchenCard({ order, onAdvance, onCancel, flash, onExpand }) {
  const [busy, setBusy] = useState(false);

  const uKey   = urgencyKey(order.created_at, order.status);
  const uClass = uKey !== 'none' ? ` kds-u-${uKey}` : '';
  const isDone = DONE_STATUSES.includes(order.status);
  const items  = Array.isArray(order.items) ? order.items : [];
  const notes  = order.notes || order.customer_notes || order.delivery_address?.notes || '';

  async function handleAdvance(id, next) {
    setBusy(true);
    try { await onAdvance(id, next); }
    finally { setBusy(false); }
  }

  return (
    <div
      className={`kds-card${uClass}${flash ? ' kds-card--flash' : ''}${isDone ? ' kds-card--done' : ''}`}
      onClick={onExpand ? () => onExpand(order.id) : undefined}
      style={onExpand ? { cursor: 'pointer' } : undefined}
    >
      {/* Header: order id + type + timer */}
      <div className="kds-card-head">
        <div className="kds-card-meta">
          <span className="kds-card-id">{getDisplayId(order.id)}</span>
          <StatusBadge order={order} />
        </div>
        <Timer iso={order.created_at} urgency={uKey} />
      </div>

      {/* Customer name */}
      <div className="kds-card-customer">
        {order.customer_name || order.customer_email || 'Guest'}
      </div>

      {/* Items */}
      <div className="kds-card-body" onClick={e => e.stopPropagation()}>
        {items.length === 0 && <div className="kds-no-items">No items</div>}
        {items.map((item, idx) => {
          const isPizza  = item.type === 'pizza' || !!item.dough;
          const isBurger = item.type === 'burger' || !!item.bun;
          const emoji    = isPizza ? '🍕' : isBurger ? '🍔' : '📦';
          const name     = item.name || cap(item.type) || 'Item';
          const qty      = item.quantity ?? 1;
          const note     = item.notes || item.special_instructions || '';
          return (
            <div key={idx} className="kds-item">
              <div className="kds-item-head">
                <div className="kds-item-image">
                  {isPizza  && <PizzaComposite  item={item} size={64} />}
                  {isBurger && <BurgerComposite item={item} size={64} />}
                  {!isPizza && !isBurger && (
                    <span className="kds-item-fallback-emoji">{emoji}</span>
                  )}
                </div>
                <div className="kds-item-info">
                  <div className="kds-item-title">
                    <span className="kds-item-emoji">{emoji}</span>
                    <span className="kds-item-name">{name}</span>
                    {qty > 1 && <span className="kds-item-qty">×{qty}</span>}
                  </div>
                  <IngredientChips item={item} />
                  {note && <div className="kds-item-note">📝 {note}</div>}
                </div>
              </div>
            </div>
          );
        })}
        {notes && (
          <div className="kds-order-notes">
            <span>📝</span>
            <span>{notes}</span>
          </div>
        )}
      </div>

      {/* Action bar */}
      <ActionBar order={order} onAdvance={handleAdvance} onCancel={onCancel} busy={busy} />
    </div>
  );
}

/* ── QueueColumn ─────────────────────────────────────────────── */
function QueueColumn({ col, orders, onAdvance, onCancel, flashIds, onExpand }) {
  return (
    <section className={`kds-col kds-col--${col.key}`}>
      <div className="kds-col-head">
        <span className="kds-col-icon">{col.icon}</span>
        <span className="kds-col-label">{col.label}</span>
        <span className="kds-col-count">{orders.length}</span>
      </div>
      <div className="kds-col-scroll">
        {orders.length === 0 ? (
          <div className="kds-empty">
            <span className="kds-empty-icon">○</span>
            <span className="kds-empty-text">All clear</span>
          </div>
        ) : (
          orders.map(order => (
            <KitchenCard
              key={order.id}
              order={order}
              onAdvance={onAdvance}
              onCancel={onCancel}
              flash={flashIds.has(order.id)}
              onExpand={onExpand}
            />
          ))
        )}
      </div>
    </section>
  );
}

/* ── Expanded overlay ────────────────────────────────────────── */
function ExpandedCard({ order, onAdvance, onCancel, onClose }) {
  const [busy, setBusy] = useState(false);

  const uKey   = urgencyKey(order.created_at, order.status);
  const uClass = uKey !== 'none' ? ` kds-u-${uKey}` : '';
  const items  = Array.isArray(order.items) ? order.items : [];
  const notes  = order.notes || order.customer_notes || order.delivery_address?.notes || '';

  async function handleAdvance(id, next) {
    setBusy(true);
    try { await onAdvance(id, next); onClose(); }
    finally { setBusy(false); }
  }

  return (
    <div className="kds-overlay" onClick={onClose}>
      <div className={`kds-exp-card${uClass}`} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="kds-exp-head">
          <div className="kds-exp-head-left">
            <div className="kds-exp-head-meta">
              <span className="kds-card-id">{getDisplayId(order.id)}</span>
              <StatusBadge order={order} />
              <Timer iso={order.created_at} urgency={uKey} />
            </div>
            <div className="kds-exp-head-name">{order.customer_name || order.customer_email || 'Guest'}</div>
          </div>
          <button className="kds-exp-close" onClick={onClose}>✕</button>
        </div>

        {/* Body */}
        <div className="kds-exp-body">
          {items.length === 0 && <div className="kds-no-items">No items</div>}
          {items.map((item, idx) => {
            const isPizza  = item.type === 'pizza' || !!item.dough;
            const isBurger = item.type === 'burger' || !!item.bun;
            const emoji    = isPizza ? '🍕' : isBurger ? '🍔' : '📦';
            const name     = item.name || cap(item.type) || 'Item';
            const qty      = item.quantity ?? 1;
            const note     = item.notes || item.special_instructions || '';
            return (
              <div key={idx} className="kds-exp-item">
                <div className="kds-exp-item-head">
                  <span>{emoji}</span>
                  <strong>{name}</strong>
                  {qty > 1 && <span className="kds-item-qty">×{qty}</span>}
                </div>
                <div className="kds-exp-item-body">
                  <div className="kds-exp-image">
                    {isPizza  && <PizzaComposite  item={item} size={148} />}
                    {isBurger && <BurgerComposite item={item} size={148} />}
                  </div>
                  <div className="kds-exp-detail">
                    <IngredientChips item={item} />
                    {note && <div className="kds-item-note">📝 {note}</div>}
                  </div>
                </div>
              </div>
            );
          })}
          {notes && (
            <div className="kds-order-notes">
              <span>📝</span>
              <span>{notes}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="kds-exp-actions">
          <ActionBar order={order} onAdvance={handleAdvance} onCancel={(id) => { onCancel(id); onClose(); }} busy={busy} />
          <button className="kds-btn kds-btn--close-exp" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

/* ── KitchenDisplay (page) ───────────────────────────────────── */
export default function KitchenDisplay() {
  const [orders,     setOrders]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [muted,      setMuted]      = useState(getMuted);
  const [,           setTick]       = useState(0);
  const [flashIds,   setFlashIds]   = useState(new Set());
  const [expandedId, setExpandedId] = useState(null);
  const channelRef = useRef(null);

  /* Initial load */
  useEffect(() => {
    fetchOrders({ since: getYesterdayStart(), limit: 300 })
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  /* Realtime */
  useEffect(() => {
    const ch = supabase
      .channel('kds-live-v3')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        const { eventType, new: nr, old: or } = payload;
        if (eventType === 'INSERT') {
          setOrders(prev => [nr, ...prev]);
          if (KITCHEN_STATUSES.includes(nr.status)) {
            setFlashIds(prev => new Set([...prev, nr.id]));
            playOrderNotification();
            setTimeout(() => setFlashIds(prev => { const s = new Set(prev); s.delete(nr.id); return s; }), 8000);
          }
        } else if (eventType === 'UPDATE') {
          setOrders(prev => prev.map(o => (o.id === nr.id ? nr : o)));
          if (KITCHEN_STATUSES.includes(nr.status) && !KITCHEN_STATUSES.includes(or?.status)) {
            setFlashIds(prev => new Set([...prev, nr.id]));
            playOrderNotification();
            setTimeout(() => setFlashIds(prev => { const s = new Set(prev); s.delete(nr.id); return s; }), 8000);
          }
        } else if (eventType === 'DELETE') {
          setOrders(prev => prev.filter(o => o.id !== or.id));
        }
      })
      .subscribe();
    channelRef.current = ch;
    return () => supabase.removeChannel(ch);
  }, []);

  /* Kitchen body context for cinematic bg */
  useEffect(() => {
    document.body.dataset.context = 'kitchen';
    return () => {
      delete document.body.dataset.context;
      document.documentElement.style.backgroundColor = '';
      document.documentElement.style.backgroundImage  = '';
    };
  }, []);

  /* 30-second tick — refreshes urgency colours */
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const handleAdvance = useCallback(async (orderId, nextStatus) => {
    setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, status: nextStatus } : o)));
    try { await updateOrderStatus(orderId, nextStatus); }
    catch (err) {
      console.error('[KDS] advance failed', err);
      fetchOrders({ since: getYesterdayStart(), limit: 300 }).then(setOrders).catch(console.error);
    }
  }, []);

  const handleCancel = useCallback(async (orderId) => {
    setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, status: 'cancelled' } : o)));
    try { await updateOrderStatus(orderId, 'cancelled'); }
    catch (err) {
      console.error('[KDS] cancel failed', err);
      fetchOrders({ since: getYesterdayStart(), limit: 300 }).then(setOrders).catch(console.error);
    }
  }, []);

  const handleMuteToggle = useCallback(() => setMuted(toggleMute()), []);
  const handleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
    else document.exitFullscreen().catch(() => {});
  }, []);

  /* Build column data */
  const shownOrders = orders.filter(o => ALL_SHOWN.includes(o.status));
  const activeCount = shownOrders.filter(o => KITCHEN_STATUSES.includes(o.status)).length;

  const columnData = COLUMNS.map(col => {
    let list = shownOrders
      .filter(o => col.statuses.includes(o.status))
      .sort((a, b) => {
        const d = new Date(a.created_at) - new Date(b.created_at);
        return col.sort === 'asc' ? d : -d;
      });
    if (col.limit) list = list.slice(0, col.limit);
    return { ...col, orders: list };
  });

  const clockTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const expandedOrder = expandedId ? orders.find(o => o.id === expandedId) : null;

  if (loading) {
    return (
      <div className="kds-root kds-loading">
        <div className="kds-loading-icon">🍔</div>
        <div className="kds-loading-text">Loading Kitchen Display…</div>
      </div>
    );
  }

  return (
    <div className="kds-root" onClick={unlockAudio}>

      {/* Header */}
      <header className="kds-header">
        <div className="kds-header-left">
          <span className="kds-logo">🍔</span>
          <span className="kds-logo-name">BURGERIZZA</span>
          <span className="kds-logo-tag">Kitchen</span>
          {activeCount > 0 && (
            <span className="kds-live-badge">{activeCount} active</span>
          )}
        </div>
        <div className="kds-header-right">
          <span className="kds-clock">{clockTime}</span>
          <button
            className={`kds-ctrl${muted ? ' kds-ctrl--muted' : ''}`}
            onClick={handleMuteToggle}
            title={muted ? 'Unmute' : 'Mute'}
            type="button"
          >
            {muted ? '🔇' : '🔊'}
          </button>
          <button className="kds-ctrl" onClick={handleFullscreen} title="Fullscreen" type="button">⛶</button>
          <a href="/admin/orders" className="kds-ctrl" title="Admin panel" onClick={e => e.stopPropagation()}>⚙</a>
        </div>
      </header>

      {/* 4-column kanban board */}
      <main className="kds-board">
        {columnData.map(col => (
          <QueueColumn
            key={col.key}
            col={col}
            orders={col.orders}
            onAdvance={handleAdvance}
            onCancel={handleCancel}
            flashIds={flashIds}
            onExpand={setExpandedId}
          />
        ))}
      </main>

      {/* Expanded overlay */}
      {expandedOrder && (
        <ExpandedCard
          order={expandedOrder}
          onAdvance={handleAdvance}
          onCancel={handleCancel}
          onClose={() => setExpandedId(null)}
        />
      )}
    </div>
  );
}
