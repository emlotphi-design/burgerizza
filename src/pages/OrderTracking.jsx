import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import Navbar from '../components/Navbar';
import TrackingHero from '../components/tracking/TrackingHero';
import TrackingTimeline from '../components/tracking/TrackingTimeline';
import OrderPreviewCard from '../components/tracking/OrderPreviewCard';
import DeliveryStatusCard from '../components/tracking/DeliveryStatusCard';
import '../styles/order-tracking.css';

const STEP_META = {
  pending:   { headline: 'Order received!',            sub: 'Your order is confirmed and queued for preparation.' },
  confirmed: { headline: 'Order confirmed!',           sub: 'The kitchen has accepted your order.' },
  preparing: { headline: 'Being freshly prepared',     sub: 'Our chefs are making your order with fresh ingredients.' },
  ready:     { headline: 'Your order is on the way!',  sub: 'Our driver is heading to your address right now.' },
  delivered: { headline: 'Order delivered!',           sub: 'Your food has arrived. Enjoy your meal! 🎉' },
  cancelled: { headline: 'Order cancelled',            sub: 'This order has been cancelled.' },
};

/* ── Loading skeleton ──────────────────────────────────── */
function Skeleton() {
  return (
    <div className="ot-page">
      <Navbar />
      <div className="ot-wrap">
        <div className="ot-skel ot-skel--hero" />
        <div className="ot-skel ot-skel--bar"  />
        <div className="ot-skel ot-skel--card" />
        <div className="ot-skel ot-skel--card" />
      </div>
    </div>
  );
}

/* ── Error / not-found ─────────────────────────────────── */
function NotFound({ onHome }) {
  return (
    <div className="ot-page">
      <Navbar />
      <div className="ot-wrap ot-wrap--center">
        <div className="ot-notfound">
          <div className="ot-notfound-icon">📭</div>
          <h2 className="ot-notfound-title">Order not found</h2>
          <p className="ot-notfound-sub">We couldn't find this order. Check your confirmation email.</p>
          <button className="ot-pill-btn ot-pill-btn--primary" onClick={onHome}>Back to Menu</button>
        </div>
      </div>
    </div>
  );
}

/* ── Delivery address card ─────────────────────────────── */
function AddressCard({ addr }) {
  if (!addr?.street && !addr?.city) return null;
  return (
    <div className="ot-card ot-addr-card">
      <div className="ot-section-label">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
        Delivery address
      </div>
      <div className="ot-addr-lines">
        <div className="ot-addr-main">
          {[addr.street, addr.houseNumber].filter(Boolean).join(' ')}
        </div>
        <div className="ot-addr-city">
          {[addr.postalCode, addr.city].filter(Boolean).join(' ')}
        </div>
        {addr.floor && <div className="ot-addr-extra">Floor: {addr.floor}</div>}
      </div>
    </div>
  );
}

/* ── CTA row ───────────────────────────────────────────── */
function CTASection({ onHome }) {
  return (
    <div className="ot-cta">
      <button className="ot-pill-btn ot-pill-btn--primary" onClick={onHome}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        Back to Menu
      </button>
      <a className="ot-pill-btn ot-pill-btn--ghost" href="tel:+49123456789">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.81 19.79 19.79 0 01.01 2.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92v2z"/>
        </svg>
        Contact Restaurant
      </a>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   MAIN PAGE — realtime logic preserved exactly
════════════════════════════════════════════════════════ */
export default function OrderTracking() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const channelRef = useRef(null);

  const [order,   setOrder]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const orderId = id || localStorage.getItem('bz_last_order_id');

  useEffect(() => {
    if (!orderId) { setLoading(false); setError('no-id'); return; }

    supabase.from('orders').select('*').eq('id', orderId).single()
      .then(({ data, error: e }) => {
        if (e || !data) { setError('not-found'); setLoading(false); return; }
        setOrder(data);
        setLoading(false);
      });

    channelRef.current = supabase
      .channel(`ot-${orderId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'orders',
        filter: `id=eq.${orderId}`,
      }, ({ new: row }) => setOrder(row))
      .subscribe();

    return () => { channelRef.current?.unsubscribe(); };
  }, [orderId]);

  if (loading) return <Skeleton />;
  if (error || !order) return <NotFound onHome={() => navigate('/')} />;

  const status  = order.status ?? 'pending';
  const meta    = STEP_META[status] ?? STEP_META.pending;
  const addr    = order.delivery_address ?? {};
  const items   = Array.isArray(order.items) ? order.items : [];
  const shortId = order.id.slice(0, 8).toUpperCase();

  return (
    <div className="ot-page">
      <Navbar />
      <div className="ot-wrap">

        <TrackingHero
          status={status}
          headline={meta.headline}
          sub={meta.sub}
          orderId={shortId}
        />

        {status !== 'cancelled' && (
          <div className="ot-card ot-timeline-card">
            <TrackingTimeline status={status} />
          </div>
        )}

        {status !== 'delivered' && status !== 'cancelled' && (
          <DeliveryStatusCard status={status} />
        )}

        <OrderPreviewCard items={items} total={order.total_price} />

        <AddressCard addr={addr} />

        <CTASection onHome={() => navigate('/')} />

      </div>
    </div>
  );
}
