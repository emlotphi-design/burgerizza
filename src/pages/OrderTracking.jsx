import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Navbar from '../components/Navbar';
import '../styles/order-tracking.css';

const STEPS = [
  { key: 'pending',   label: 'Received',    icon: '📋', headline: 'Order received!',             sub: 'Your order is confirmed and queued for preparation.' },
  { key: 'preparing', label: 'Preparing',   icon: '👨‍🍳', headline: 'Being freshly prepared',      sub: 'Our chefs are making your order with fresh ingredients.' },
  { key: 'ready',     label: 'On the way',  icon: '🛵', headline: 'Your order is on the way!',   sub: 'Our driver is heading to your address right now.' },
  { key: 'delivered', label: 'Delivered',   icon: '✅', headline: 'Order delivered!',             sub: 'Your food has arrived. Enjoy your meal!' },
];
const STEP_KEYS = STEPS.map(s => s.key);

/* ── Animations ─────────────────────────────────────────────── */
function PendingAnimation() {
  return (
    <div className="ot-anim-pending">
      <div className="ot-anim-receipt">📋</div>
      <div className="ot-anim-dots">
        <span className="ot-anim-dot" />
        <span className="ot-anim-dot" />
        <span className="ot-anim-dot" />
      </div>
      <p className="ot-anim-text">Waiting for the kitchen to accept…</p>
    </div>
  );
}

function PrepAnimation() {
  return (
    <div className="ot-anim-prep">
      <div className="ot-anim-kitchen">
        <div className="ot-anim-chef">👨‍🍳</div>
        <div className="ot-anim-items">
          <div className="ot-anim-food ot-anim-food--1">🍔</div>
          <div className="ot-anim-food ot-anim-food--2">🍕</div>
          <div className="ot-anim-food ot-anim-food--3">🍟</div>
        </div>
      </div>
      <div className="ot-anim-dots">
        <span className="ot-anim-dot" />
        <span className="ot-anim-dot" />
        <span className="ot-anim-dot" />
      </div>
      <p className="ot-anim-text">Your food is being freshly made</p>
    </div>
  );
}

function DeliveryAnimation() {
  return (
    <div className="ot-anim-delivery">
      <div className="ot-anim-road">
        <div className="ot-anim-scooter">🛵</div>
        <div className="ot-anim-destination">🏠</div>
      </div>
      <p className="ot-anim-text">Driver is heading to your location</p>
    </div>
  );
}

function DeliveredAnimation() {
  return (
    <div className="ot-anim-delivered">
      <div className="ot-anim-checkmark">
        <svg viewBox="0 0 52 52" fill="none">
          <circle
            className="ot-check-circle"
            cx="26" cy="26" r="25"
            fill="none"
            stroke="#22c55e"
            strokeWidth="2"
          />
          <polyline
            className="ot-check-mark"
            points="14,27 21,34 38,17"
            fill="none"
            stroke="#22c55e"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <p className="ot-anim-text ot-anim-text--delivered">Enjoy your meal! 🎉</p>
    </div>
  );
}

/* ── Helpers ─────────────────────────────────────────────────── */
function fmtCurrency(n) {
  return '€' + Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/* ════════════════════════════════════════════════════════════
   ORDER TRACKING PAGE
════════════════════════════════════════════════════════════ */
export default function OrderTracking() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const channelRef  = useRef(null);

  const [order,   setOrder]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const orderId = id || localStorage.getItem('bz_last_order_id');

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      setError('no-id');
      return;
    }

    supabase.from('orders').select('*').eq('id', orderId).single()
      .then(({ data, error: e }) => {
        if (e || !data) { setError('not-found'); setLoading(false); return; }
        setOrder(data);
        setLoading(false);
      });

    channelRef.current = supabase
      .channel(`ot-${orderId}`)
      .on('postgres_changes', {
        event:  'UPDATE',
        schema: 'public',
        table:  'orders',
        filter: `id=eq.${orderId}`,
      }, ({ new: row }) => setOrder(row))
      .subscribe();

    return () => { channelRef.current?.unsubscribe(); };
  }, [orderId]);

  /* Step resolution */
  const stepIdx       = order ? STEP_KEYS.indexOf(order.status) : 0;
  const effectiveIdx  = stepIdx === -1 ? 0 : stepIdx;
  const currentStep   = STEPS[effectiveIdx];
  const isCancelled   = order?.status === 'cancelled';
  const isDelivered   = order?.status === 'delivered';

  function renderAnimation() {
    if (!order) return null;
    if (isDelivered)   return <DeliveredAnimation />;
    if (order.status === 'ready') return <DeliveryAnimation />;
    if (order.status === 'preparing' || order.status === 'confirmed') return <PrepAnimation />;
    return <PendingAnimation />;
  }

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="ot-page">
        <Navbar />
        <div className="ot-wrap">
          <div className="ot-loading">
            <div className="ot-spinner" />
            <p>Loading your order…</p>
          </div>
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (error || !order) {
    return (
      <div className="ot-page">
        <Navbar />
        <div className="ot-wrap">
          <div className="ot-error">
            <div className="ot-error-icon">📭</div>
            <h2>Order not found</h2>
            <p>We couldn't find your order details. Please check your confirmation email.</p>
            <button className="ot-btn" onClick={() => navigate('/')}>Back to Home</button>
          </div>
        </div>
      </div>
    );
  }

  const addr  = order.delivery_address || {};
  const items = Array.isArray(order.items) ? order.items : [];

  return (
    <div className="ot-page">
      <Navbar />

      <div className="ot-wrap">

        {/* Header */}
        <div className="ot-header">
          <div className="ot-order-id">
            Order <span>#{order.id.slice(0, 8).toUpperCase()}</span>
          </div>
          <h1 className="ot-headline">
            {isCancelled ? 'Order Cancelled' : currentStep?.headline ?? 'Tracking your order'}
          </h1>
        </div>

        {/* Animation zone or cancelled banner */}
        {isCancelled ? (
          <div className="ot-cancelled-banner">
            <span>❌</span> This order has been cancelled
          </div>
        ) : (
          <div className="ot-anim-zone">
            {renderAnimation()}
          </div>
        )}

        {/* Progress steps */}
        {!isCancelled && (
          <div className="ot-steps">
            {STEPS.map((step, i) => {
              const done   = i < effectiveIdx;
              const active = i === effectiveIdx;
              return (
                <div
                  key={step.key}
                  className={`ot-step${done ? ' ot-step--done' : active ? ' ot-step--active' : ''}`}
                >
                  <div className="ot-step-dot">
                    {done ? (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    ) : (
                      <span className="ot-step-icon">{step.icon}</span>
                    )}
                  </div>
                  {i < STEPS.length - 1 && <div className="ot-step-line" />}
                  <span className="ot-step-label">{step.label}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Sub-text for active status */}
        {!isCancelled && currentStep?.sub && (
          <p style={{
            fontSize: 13,
            fontWeight: 700,
            color: 'rgba(255,255,255,0.40)',
            textAlign: 'center',
            margin: 0,
            lineHeight: 1.5,
          }}>
            {currentStep.sub}
          </p>
        )}

        {/* Order summary */}
        {items.length > 0 && (
          <div className="ot-summary">
            <div className="ot-summary-title">Your Order</div>
            <div className="ot-summary-items">
              {items.map((item, i) => (
                <div key={i} className="ot-summary-item">
                  <span className="ot-summary-emoji">{item.type === 'burger' ? '🍔' : '🍕'}</span>
                  <span className="ot-summary-name">{item.name || item.type || 'Item'}</span>
                  {(item.quantity ?? 1) > 1 && (
                    <span className="ot-summary-qty">×{item.quantity}</span>
                  )}
                </div>
              ))}
            </div>
            <div className="ot-summary-total">
              Total <strong>{fmtCurrency(order.total_price)}</strong>
            </div>
          </div>
        )}

        {/* Delivery address */}
        {(addr.street || addr.city) && (
          <div className="ot-address">
            <div className="ot-address-icon">📍</div>
            <div>
              <div className="ot-address-label">Delivery address</div>
              <div className="ot-address-line">
                {[addr.street, addr.houseNumber].filter(Boolean).join(' ')}
              </div>
              <div className="ot-address-city">
                {[addr.postalCode, addr.city].filter(Boolean).join(' ')}
              </div>
            </div>
          </div>
        )}

        <button className="ot-btn ot-btn--ghost" onClick={() => navigate('/')}>
          ← Back to Menu
        </button>

      </div>
    </div>
  );
}
