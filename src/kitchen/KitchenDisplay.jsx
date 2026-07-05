import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../services/supabase';
import dbgLight from '../assets/backgrounds/dbg.png';
import dbgDark  from '../assets/backgrounds/dbgn.png';
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

/* ── Status constants ──────────────────────────────────────────── */

/*
 * Kitchen only receives orders AFTER admin approval:
 * pending → (admin approves) → confirmed  ← kitchen NEW
 *                            → preparing  ← kitchen PREPARING
 *
 * "Mark Ready" moves an order to `ready` status → it leaves the kitchen
 * entirely and appears in the driver panel. Kitchen is done at that point.
 */
const ACTIVE_STATUSES = ['confirmed', 'preparing'];
const DONE_STATUSES   = ['delivered', 'cancelled'];

const SECTIONS = [
  {
    key:      'new',
    label:    'NEW',
    emoji:    '🔥',
    color:    '#f0a020',
    statuses: ['confirmed'],
    sort:     'desc',
  },
  {
    key:      'preparing',
    label:    'PREPARING',
    emoji:    '🍳',
    color:    '#e06828',
    statuses: ['preparing'],
    sort:     'asc',
  },
];

const NEXT_STATUS = {
  confirmed: 'preparing',
  preparing: 'ready',   // moves order out of kitchen → into driver panel
};


/* ── Pure helpers ───────────────────────────────────────────────── */

function getMinutes(iso) {
  return Math.floor((Date.now() - new Date(iso)) / 60000);
}
function formatAge(iso) {
  const m = getMinutes(iso);
  if (m < 1)  return 'Just now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}
function urgencyClass(iso) {
  const m = getMinutes(iso);
  if (m < 5)  return 'kds-u-fresh';
  if (m < 10) return 'kds-u-warm';
  return 'kds-u-urgent';
}
function orderTypeInfo(order) {
  if (order.table_number) return { icon: '🍽️', text: `Table ${order.table_number}`, isDelivery: false };
  const src = order.source ?? order.delivery_address?.source ?? '';
  if (src === 'pos' || src === 'restaurant_mode') return { icon: '🏪', text: 'In-store', isDelivery: false };
  if (order.order_type === 'pickup')   return { icon: '🏃', text: 'Pickup', isDelivery: false };
  if (order.order_type === 'delivery') return { icon: '🛵', text: 'Delivery', isDelivery: true };
  if (order.delivery_address?.street)  return { icon: '🛵', text: 'Delivery', isDelivery: true };
  return { icon: '📦', text: 'Order', isDelivery: false };
}
function cap(s) {
  return s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : '';
}

/* ── Layer image with graceful fallback ──────────────────────────
   If a composite layer's image URL 404s (e.g. asset mismatch after a
   deploy), showing the browser's default broken-image icon is both
   ugly and undiagnosable at a glance on a kitchen screen. This shows
   the failing ingredient id instead, so the problem is visible
   without needing devtools. */
function Layer({ src, label, style }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        style={{
          ...style,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          fontSize: 8,
          lineHeight: 1.2,
          color: '#ff8080',
          background: 'rgba(255, 0, 0, 0.08)',
          border: '1px dashed rgba(255, 80, 80, 0.5)',
          borderRadius: '50%',
          overflow: 'hidden',
          padding: 2,
        }}
        title={`Image failed to load: ${label}`}
      >
        {label}
      </div>
    );
  }

  return <img src={src} alt="" style={style} onError={() => setFailed(true)} />;
}

/* ── Pizza composite ────────────────────────────────────────────── */
function PizzaComposite({ item, size }) {
  const s     = size;
  const dough = PIZZA_DOUGHS[item.dough];
  const sauce = PIZZA_SAUCES[item.sauce];
  const chz   = PIZZA_CHEESES[item.cheese];
  const meats = (item.meats ?? []).map(id => ({ id, ...PIZZA_MEATS[id] })).filter(m => m.layer);
  const vegs  = (item.vegetables ?? []).map(id => ({ id, ...PIZZA_VEGETABLES[id] })).filter(v => v.layer);

  const hasLayers = dough || sauce || chz || meats.length || vegs.length;
  if (!hasLayers) return null;

  function px(pct) { return Math.round(s * pct / 100); }
  function centered(sizePct, zIndex, offsetPct = 0) {
    const dim = px(sizePct);
    return {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: offsetPct
        ? `translate(-50%, calc(-50% + ${px(offsetPct)}px))`
        : 'translate(-50%, -50%)',
      width: dim,
      height: dim,
      objectFit: 'contain',
      zIndex,
      pointerEvents: 'none',
    };
  }

  return (
    <div className="kds-composite kds-composite--pizza" style={{ width: s, height: s }}>
      <Layer src={trayImg} label="tray" style={centered(54, 1)} />
      {dough && <Layer src={dough.full} label={`dough:${item.dough}`} style={centered(49, 2)} />}
      {sauce && <Layer src={sauce.layer} label={`sauce:${item.sauce}`} style={centered(sauce.layerPct ?? 42, 3)} />}
      {chz   && <Layer src={chz.layer}   label={`cheese:${item.cheese}`} style={centered(40, 4, chz.offsetPct ?? 0)} />}
      {meats.map((m, i) => (
        <Layer key={m.id} src={m.layer} label={`meat:${m.id}`} style={centered(m.layerPct ?? 42, 5 + i)} />
      ))}
      {vegs.map((v, i) => (
        <Layer key={v.id} src={v.layer} label={`veg:${v.id}`}
          style={centered(v.layerPct ?? 42, 5 + meats.length + i, v.offsetPct ?? 0)} />
      ))}
    </div>
  );
}

/* ── Burger composite ────────────────────────────────────────────── */
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
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: dim,
      height: dim,
      objectFit: 'contain',
      zIndex,
      pointerEvents: 'none',
    };
  }

  // Build ingredient layers in order: meats → cheeses → sauces → vegetables
  const layers = [];
  let z = 2;

  if (item.burger_meats && typeof item.burger_meats === 'object') {
    Object.entries(item.burger_meats).filter(([, q]) => q > 0).forEach(([id]) => {
      const src = MEAT_BASES[id];
      if (src) layers.push({ id, src, z: z++, pct: bunPct });
    });
  }
  if (item.cheeses && typeof item.cheeses === 'object') {
    Object.entries(item.cheeses).filter(([, q]) => q > 0).forEach(([id]) => {
      const src = CHEESE_BASES[id];
      if (src) layers.push({ id, src, z: z++, pct: bunPct });
    });
  }
  (item.sauces ?? []).forEach(id => {
    const src = SAUCE_BASES[id];
    if (src) layers.push({ id, src, z: z++, pct: bunPct });
  });
  (item.vegetables ?? []).forEach(id => {
    const src = VEGETABLE_BASES[id];
    if (src) layers.push({ id, src, z: z++, pct: bunPct });
  });

  return (
    <div className="kds-composite kds-composite--burger" style={{ width: s, height: s }}>
      <img src={DEFAULT_WRAPPER} alt="" style={{ ...centered(100, 0), objectFit: 'cover', opacity: 0.25 }} />
      <img src={bunBase} alt="" style={centered(bunPct, 1)} />
      {layers.map(l => (
        <img key={l.id} src={l.src} alt="" style={centered(l.pct, l.z)} />
      ))}
      {bunTop && <img src={bunTop} alt="" style={centered(bunPct, 100)} />}
    </div>
  );
}

/* ── Ingredient chips ────────────────────────────────────────────── */
function IngredientChips({ item }) {
  const chips = [];

  if (item.type === 'pizza' || item.dough) {
    const d = PIZZA_DOUGHS[item.dough];
    if (d) chips.push({ img: d.preview, label: d.label });

    const s = PIZZA_SAUCES[item.sauce];
    if (s) chips.push({ img: s.preview, label: s.label });

    const c = PIZZA_CHEESES[item.cheese];
    if (c) chips.push({ img: c.preview, label: c.label });

    (item.meats ?? []).forEach(id => {
      const m = PIZZA_MEATS[id];
      if (m) chips.push({ img: m.preview, label: m.label });
    });
    (item.vegetables ?? []).forEach(id => {
      const v = PIZZA_VEGETABLES[id];
      if (v) chips.push({ img: v.preview, label: v.label });
    });

  } else if (item.type === 'burger' || item.bun) {
    const bp = BUN_PREVIEWS[item.bun];
    if (bp) chips.push({ img: bp, label: cap(item.bun?.replace(/bun\d?$/, '') || item.bun) });

    if (item.burger_meats && typeof item.burger_meats === 'object') {
      Object.entries(item.burger_meats).filter(([, q]) => q > 0).forEach(([id, qty]) => {
        const p = MEAT_PREVIEWS[id];
        if (p) chips.push({ img: p, label: `${cap(id)}${qty > 1 ? ` ×${qty}` : ''}` });
      });
    }
    if (item.cheeses && typeof item.cheeses === 'object') {
      Object.entries(item.cheeses).filter(([, q]) => q > 0).forEach(([id, qty]) => {
        const p = CHEESE_PREVIEWS[id];
        if (p) chips.push({ img: p, label: `${cap(id)}${qty > 1 ? ` ×${qty}` : ''}` });
      });
    }
    (item.sauces ?? []).forEach(id => {
      const p = SAUCE_PREVIEWS[id];
      if (p) chips.push({ img: p, label: cap(id) });
    });
    (item.vegetables ?? []).forEach(id => {
      const p = VEGETABLE_PREVIEWS[id];
      if (p) chips.push({ img: p, label: cap(id) });
    });
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

/* ── OrderCard ─────────────────────────────────────────────────── */
function OrderCard({ order, onAdvance, onCancel, flash, expandedId, setExpandedId }) {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [busy, setBusy]                   = useState(false);
  const timerRef = useRef(null);

  const isDone    = DONE_STATUSES.includes(order.status);
  const uClass    = isDone ? '' : urgencyClass(order.created_at);
  const typeInfo  = orderTypeInfo(order);
  const items     = Array.isArray(order.items) ? order.items : [];
  const shortId   = '#' + order.id.slice(0, 8).toUpperCase();
  const custNotes = (order.delivery_address || {}).notes || null;
  const isExpanded = expandedId === order.id;

  async function doAdvance() {
    if (busy) return;
    setBusy(true);
    try { await onAdvance(order.id, NEXT_STATUS[order.status]); }
    finally { setBusy(false); }
  }

  function initCancel() {
    if (confirmCancel) {
      clearTimeout(timerRef.current);
      onCancel(order.id);
      setConfirmCancel(false);
    } else {
      setConfirmCancel(true);
      timerRef.current = setTimeout(() => setConfirmCancel(false), 4000);
    }
  }

  function stopAndExpand(e) {
    e.stopPropagation();
    setExpandedId(order.id);
  }

  return (
    <>
      {/* ── Compact card ── */}
      <div
        className={`kds-card ${uClass}${flash ? ' kds-card--flash' : ''}${isDone ? ' kds-card--done' : ''}`}
        onClick={setExpandedId ? stopAndExpand : undefined}
        style={setExpandedId ? { cursor: 'pointer' } : undefined}
      >
        {/* Single-row header */}
        <div className="kds-card-head">
          <div className="kds-card-head-left">
            <span className="kds-card-id">{shortId}</span>
            <span className="kds-card-name">{order.customer_name || 'Guest'}</span>
          </div>
          <div className="kds-card-head-right">
            <span className={`kds-card-age ${uClass}`}>{formatAge(order.created_at)}</span>
            <span className="kds-card-type">{typeInfo.icon} {typeInfo.text}</span>
            {setExpandedId && <span className="kds-expand-hint">⤢</span>}
          </div>
        </div>

        {/* Scrollable items grid */}
        <div className="kds-card-body">
          {items.length === 0 && <p className="kds-no-items">No items</p>}
          <div className="kds-items-grid">
            {items.map((item, idx) => {
              const isPizza  = item.type === 'pizza' || !!item.dough;
              const isBurger = item.type === 'burger' || !!item.bun;
              const emoji    = isPizza ? '🍕' : isBurger ? '🍔' : '📦';
              const name     = item.name || cap(item.type) || 'Item';
              const qty      = item.quantity ?? 1;
              const note     = item.notes || item.special_instructions || '';
              return (
                <div key={idx} className="kds-item-tile">
                  <div className="kds-tile-image">
                    {isPizza  && <PizzaComposite  item={item} size={96} />}
                    {isBurger && <BurgerComposite item={item} size={96} />}
                  </div>
                  <div className="kds-tile-content">
                    <div className="kds-tile-title">
                      <span className="kds-tile-emoji">{emoji}</span>
                      <strong>{name}</strong>
                      {qty > 1 && <span className="kds-item-qty">×{qty}</span>}
                    </div>
                    <IngredientChips item={item} />
                    {note && <p className="kds-item-note">📝 {note}</p>}
                  </div>
                </div>
              );
            })}
          </div>
          {custNotes && (
            <div className="kds-order-notes">
              <span className="kds-order-notes-icon">📝</span>
              <span>{custNotes}</span>
            </div>
          )}
        </div>

        {/* Fixed footer — workflow controls */}
        {confirmCancel ? (
          <div className="kds-card-actions" onClick={e => e.stopPropagation()}>
            <button className="kds-btn kds-btn--cancel-confirm" onClick={initCancel}>🔴 Cancel?</button>
            <button className="kds-btn kds-btn--keep" onClick={() => { clearTimeout(timerRef.current); setConfirmCancel(false); }}>Keep</button>
          </div>
        ) : order.status === 'confirmed' ? (
          <div className="kds-card-actions" onClick={e => e.stopPropagation()}>
            <button className="kds-btn kds-btn--advance kds-btn--start" onClick={doAdvance} disabled={busy}>
              {busy ? '…' : '▶ Start Preparing'}
            </button>
            <button className="kds-btn kds-btn--cancel" onClick={initCancel} title="Cancel">✕</button>
          </div>
        ) : order.status === 'preparing' ? (
          <div className="kds-card-actions" onClick={e => e.stopPropagation()}>
            <button className="kds-btn kds-btn--advance kds-btn--ready" onClick={doAdvance} disabled={busy}>
              {busy ? '…' : '✓ Mark Ready'}
            </button>
            <button className="kds-btn kds-btn--cancel" onClick={initCancel} title="Cancel">✕</button>
          </div>
        ) : isDone ? (
          <div className="kds-card-actions">
            {order.status === 'delivered' && <span className="kds-badge-delivered">✓ Delivered</span>}
            {order.status === 'cancelled'  && <span className="kds-badge-cancelled">✕ Cancelled</span>}
          </div>
        ) : null}
      </div>

      {/* ── Expanded overlay ── */}
      {isExpanded && (
        <div className="kds-overlay" onClick={() => setExpandedId(null)}>
          <div className={`kds-exp-card ${uClass}`} onClick={e => e.stopPropagation()}>

            {/* Expanded header */}
            <div className="kds-exp-head">
              <div className="kds-card-head-left">
                <span className="kds-card-id">{shortId}</span>
                <span className="kds-card-name">{order.customer_name || 'Guest'}</span>
              </div>
              <div className="kds-card-head-right">
                <span className={`kds-card-age ${uClass}`}>{formatAge(order.created_at)}</span>
                <span className="kds-card-type">{typeInfo.icon} {typeInfo.text}</span>
              </div>
              <button className="kds-exp-close" onClick={() => setExpandedId(null)} title="Close">✕</button>
            </div>

            {/* Expanded scrollable body */}
            <div className="kds-exp-body">
              {items.length === 0 && <p className="kds-no-items">No items</p>}
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
                      <span className="kds-exp-item-emoji">{emoji}</span>
                      <strong className="kds-exp-item-name">{name}</strong>
                      {qty > 1 && <span className="kds-item-qty">×{qty}</span>}
                    </div>
                    <div className="kds-exp-item-body">
                      <div className="kds-exp-image">
                        {isPizza  && <PizzaComposite  item={item} size={190} />}
                        {isBurger && <BurgerComposite item={item} size={190} />}
                      </div>
                      <div className="kds-exp-detail">
                        <IngredientChips item={item} />
                        {note && <p className="kds-item-note kds-exp-note">📝 {note}</p>}
                      </div>
                    </div>
                  </div>
                );
              })}
              {custNotes && (
                <div className="kds-order-notes kds-exp-order-notes">
                  <span className="kds-order-notes-icon">📝</span>
                  <span>{custNotes}</span>
                </div>
              )}
            </div>

            {/* Expanded footer — workflow controls */}
            {confirmCancel ? (
              <div className="kds-exp-actions">
                <button className="kds-btn kds-btn--cancel-confirm" onClick={initCancel}>🔴 Cancel?</button>
                <button className="kds-btn kds-btn--keep" onClick={() => { clearTimeout(timerRef.current); setConfirmCancel(false); }}>Keep</button>
                <button className="kds-btn kds-btn--close-exp" onClick={() => setExpandedId(null)}>Close</button>
              </div>
            ) : order.status === 'confirmed' ? (
              <div className="kds-exp-actions">
                <button className="kds-btn kds-btn--advance kds-btn--start" onClick={doAdvance} disabled={busy}>
                  {busy ? '…' : '▶ Start Preparing'}
                </button>
                <button className="kds-btn kds-btn--cancel" onClick={initCancel} title="Cancel order">✕</button>
                <button className="kds-btn kds-btn--close-exp" onClick={() => setExpandedId(null)}>Close</button>
              </div>
            ) : order.status === 'preparing' ? (
              <div className="kds-exp-actions">
                <button className="kds-btn kds-btn--advance kds-btn--ready" onClick={doAdvance} disabled={busy}>
                  {busy ? '…' : '✓ Mark Ready'}
                </button>
                <button className="kds-btn kds-btn--cancel" onClick={initCancel} title="Cancel order">✕</button>
                <button className="kds-btn kds-btn--close-exp" onClick={() => setExpandedId(null)}>Close</button>
              </div>
            ) : (
              <div className="kds-exp-actions">
                {order.status === 'delivered' && <span className="kds-badge-delivered">✓ Delivered</span>}
                {order.status === 'cancelled'  && <span className="kds-badge-cancelled">✕ Cancelled</span>}
                <button className="kds-btn kds-btn--close-exp" onClick={() => setExpandedId(null)}>Close</button>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
}

/* ── KitchenDisplay (page) ──────────────────────────────────────── */
export default function KitchenDisplay() {
  const [orders,     setOrders]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [muted,      setMuted]      = useState(getMuted);
  const [, setTick]                 = useState(0);
  const [flashIds,   setFlashIds]   = useState(new Set());
  const [showDone,   setShowDone]   = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [theme,    setTheme]    = useState(() => localStorage.getItem('kds-theme') || 'dark');
  const channelRef  = useRef(null);

  /* Load today + yesterday orders */
  useEffect(() => {
    fetchOrders({ since: getYesterdayStart(), limit: 300 })
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  /* Realtime — approved orders appear instantly */
  useEffect(() => {
    const ch = supabase
      .channel('kds-live-v2')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        const { eventType, new: nr, old: or } = payload;

        if (eventType === 'INSERT') {
          setOrders(prev => [nr, ...prev]);
          if (ACTIVE_STATUSES.includes(nr.status)) {
            setFlashIds(prev => new Set([...prev, nr.id]));
            playOrderNotification();
            setTimeout(() => setFlashIds(prev => { const s = new Set(prev); s.delete(nr.id); return s; }), 8000);
          }
        } else if (eventType === 'UPDATE') {
          setOrders(prev => prev.map(o => (o.id === nr.id ? nr : o)));
          // Flash + sound when an order transitions INTO kitchen (pending → confirmed)
          if (ACTIVE_STATUSES.includes(nr.status) && !ACTIVE_STATUSES.includes(or?.status)) {
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

  /* Tag <body> so kitchen.css can drive the real cinematic background.
     On unmount, clear the html inline style set by the index.html
     anti-flash script so the main site background is not blocked. */
  useEffect(() => {
    document.body.dataset.context = 'kitchen';
    return () => {
      delete document.body.dataset.context;
      document.documentElement.style.backgroundColor = '';
      document.documentElement.style.backgroundImage  = '';
    };
  }, []);

  /* DEBUG: Background via inline style — same reasoning as Dashboard.
     kitchen.css sets body[data-context="kitchen"] with !important gradient.
     element.style.setProperty(..., 'important') is above that entire layer. */
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('[KdsBG] light =', dbgLight, '| dark =', dbgDark);

    return () => {
      ['background-image', 'background-size', 'background-position',
       'background-repeat', 'background-attachment', 'background-color']
        .forEach(p => document.body.style.removeProperty(p));
      document.querySelector('.kds-root')?.style.removeProperty('background');
    };
  }, []);

  useEffect(() => {
    const img = theme === 'dark' ? dbgDark : dbgLight;
    // eslint-disable-next-line no-console
    console.log('[KdsBG] apply →', theme, img);

    document.body.style.setProperty('background-image',      `url('${img}')`, 'important');
    document.body.style.setProperty('background-size',       'cover',         'important');
    document.body.style.setProperty('background-position',   'center',        'important');
    document.body.style.setProperty('background-repeat',     'no-repeat',     'important');
    document.body.style.setProperty('background-attachment', 'fixed',         'important');
    document.body.style.setProperty('background-color',      theme === 'dark' ? '#000' : '#fff', 'important');

    // Light mode: kitchen.css gives .kds-root[data-theme="light"] its own solid
    // background — punch through it so the body image shows through.
    const root = document.querySelector('.kds-root');
    if (root) {
      if (theme === 'light') {
        root.style.setProperty('background', 'transparent', 'important');
      } else {
        root.style.removeProperty('background');
      }
    }
  }, [theme]);

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

  /* Persist theme */
  useEffect(() => { localStorage.setItem('kds-theme', theme); }, [theme]);

  const handleMuteToggle  = useCallback(() => setMuted(toggleMute()), []);
  const handleThemeToggle = useCallback(() => setTheme(t => t === 'dark' ? 'light' : 'dark'), []);
  const handleFullscreen  = useCallback(() => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
    else document.exitFullscreen().catch(() => {});
  }, []);

  const activeOrders = orders.filter(o => ACTIVE_STATUSES.includes(o.status));
  const doneOrders   = orders.filter(o => DONE_STATUSES.includes(o.status));
  const totalActive  = activeOrders.length;

  const sectionData = SECTIONS.map(sec => ({
    ...sec,
    orders: activeOrders
      .filter(o => sec.statuses.includes(o.status))
      .sort((a, b) => {
        const d = new Date(a.created_at) - new Date(b.created_at);
        return sec.sort === 'asc' ? d : -d;
      }),
  }));

  const clockTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  if (loading) {
    return (
      <div className="kds-root kds-loading" data-theme={theme}>
        <div className="kds-loading-icon">🍔</div>
        <div className="kds-loading-text">Loading Kitchen Display…</div>
      </div>
    );
  }

  return (
    <div className="kds-root" data-theme={theme} onClick={unlockAudio}>

      <header className="kds-header">
        <div className="kds-header-left">
          <span className="kds-logo">🍔</span>
          <span className="kds-logo-name">BURGERIZZA</span>
          <span className="kds-logo-tag">Kitchen</span>
          {totalActive > 0 && (
            <span className="kds-live-badge">{totalActive} active</span>
          )}
        </div>
        <div className="kds-header-right">
          <span className="kds-clock">{clockTime}</span>
          <button className={`kds-ctrl${muted ? ' kds-ctrl--muted' : ''}`}
            onClick={handleMuteToggle} title={muted ? 'Unmute' : 'Mute'}>
            {muted ? '🔇' : '🔊'}
          </button>
          <button className="kds-ctrl" onClick={handleThemeToggle}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button className="kds-ctrl" onClick={handleFullscreen} title="Fullscreen">⛶</button>
          <a href="/admin/orders" className="kds-ctrl" title="Admin panel" onClick={e => e.stopPropagation()}>⚙</a>
        </div>
      </header>

      <main className="kds-board">
        {sectionData.map(sec => (
          <section key={sec.key} className={`kds-section kds-section--${sec.key}`}>
            <div className="kds-section-head" style={{ '--sc': sec.color }}>
              <span className="kds-section-emoji">{sec.emoji}</span>
              <span className="kds-section-label">{sec.label}</span>
              <span className="kds-section-count">{sec.orders.length}</span>
            </div>
            <div className="kds-section-scroll">
              {sec.orders.length === 0
                ? <div className="kds-empty">No orders</div>
                : sec.orders.map(order => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onAdvance={handleAdvance}
                      onCancel={handleCancel}
                      flash={flashIds.has(order.id)}
                      expandedId={expandedId}
                      setExpandedId={setExpandedId}
                    />
                  ))
              }
            </div>
          </section>
        ))}
      </main>

      {doneOrders.length > 0 && (
        <div className="kds-done-strip">
          <button className="kds-done-toggle" onClick={() => setShowDone(v => !v)}>
            {showDone ? '▲' : '▼'}&nbsp; Completed Today · {doneOrders.length}
          </button>
          {showDone && (
            <div className="kds-done-cards">
              {doneOrders
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, 30)
                .map(o => (
                  <OrderCard key={o.id} order={o} onAdvance={handleAdvance} onCancel={handleCancel} flash={false}
                    expandedId={expandedId} setExpandedId={setExpandedId} />
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
