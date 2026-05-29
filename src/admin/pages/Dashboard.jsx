import { useEffect, useRef, useState } from 'react';
import { fetchDashboardStats, subscribeToOrders } from '../services/adminService';

const STATUS_BADGE = {
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
    const qty = i.quantity || i.qty || 1;
    return qty > 1 ? `${label} ×${qty}` : label;
  }).slice(0, 2).join(', ') + (items.length > 2 ? ` +${items.length - 2} more` : '');
}

export default function Dashboard() {
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const channelRef = useRef(null);

  function load() {
    fetchDashboardStats()
      .then(setStats)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // Re-fetch stats whenever any order is inserted or updated
    channelRef.current = subscribeToOrders(({ eventType }) => {
      if (eventType === 'INSERT' || eventType === 'UPDATE') load();
    });
    return () => { channelRef.current?.unsubscribe(); };
  }, []);

  const STAT_CARDS = [
    {
      label: 'Total Orders',
      value: loading ? '…' : (stats?.totalOrders ?? 0),
      footer: 'All time',
      cardClass: 'adm-stat-card--amber',
      iconClass: 'adm-stat-icon--amber',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <path d="M16 10a4 4 0 01-8 0"/>
        </svg>
      ),
    },
    {
      label: 'Total Revenue',
      value: loading ? '…' : fmtCurrency(stats?.revenue ?? 0),
      footer: 'Excluding cancelled',
      cardClass: 'adm-stat-card--green',
      iconClass: 'adm-stat-icon--green',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23"/>
          <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
        </svg>
      ),
    },
    {
      label: 'Registered Users',
      value: loading ? '…' : (stats?.totalUsers ?? 0),
      footer: 'Total accounts',
      cardClass: 'adm-stat-card--blue',
      iconClass: 'adm-stat-icon--blue',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
        </svg>
      ),
    },
    {
      label: 'Menu Categories',
      value: '4',
      footer: 'Pizza · Burger · Drinks · Sides',
      cardClass: 'adm-stat-card--orange',
      iconClass: 'adm-stat-icon--orange',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
          <line x1="7" y1="7" x2="7.01" y2="7"/>
        </svg>
      ),
    },
  ];

  const recentOrders = stats?.recentOrders ?? [];

  return (
    <>
      <div className="adm-page-header">
        <h1 className="adm-page-title">Dashboard</h1>
        <p className="adm-page-subtitle">Welcome back — here's what's happening at Burgerizza.</p>
      </div>

      {error && (
        <div className="adm-card" style={{ marginBottom: 20, color: 'var(--adm-danger, #e03d3d)', fontSize: 13 }}>
          Failed to load stats: {error}
        </div>
      )}

      <div className="adm-stats-grid">
        {STAT_CARDS.map(s => (
          <div key={s.label} className={`adm-card adm-stat-card ${s.cardClass}`}>
            <div className="adm-stat-top">
              <div className={`adm-stat-icon ${s.iconClass}`}>{s.icon}</div>
            </div>
            <div className="adm-stat-value">{s.value}</div>
            <div className="adm-stat-label">{s.label}</div>
            <div className="adm-stat-footer">{s.footer}</div>
          </div>
        ))}
      </div>

      <div className="adm-card">
        <div className="adm-section-head">
          <span className="adm-section-title">Recent Orders</span>
          <a href="/admin/orders" className="adm-section-action" style={{ textDecoration: 'none' }}>View all →</a>
        </div>
        {loading ? (
          <div className="adm-empty">
            <div className="adm-empty-sub">Loading…</div>
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="adm-empty">
            <div className="adm-empty-emoji">📭</div>
            <div className="adm-empty-title">No orders yet</div>
            <div className="adm-empty-sub">Orders will appear here once customers start placing them.</div>
          </div>
        ) : (
          <>
            {/* Desktop/tablet table */}
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map(o => (
                    <tr key={o.id}>
                      <td style={{ fontWeight: 900 }}>#{o.id.slice(0, 8).toUpperCase()}</td>
                      <td>
                        <div style={{ fontWeight: 800 }}>{o.customer_name || '—'}</div>
                        <div className="adm-table-muted">{o.customer_email || ''}</div>
                      </td>
                      <td className="adm-table-muted">{itemsSummary(o.items)}</td>
                      <td style={{ fontWeight: 900 }}>{fmtCurrency(o.total_price)}</td>
                      <td>{STATUS_BADGE[o.status] ?? <span className="adm-badge adm-badge--gray">{o.status}</span>}</td>
                      <td className="adm-table-muted">{fmtDate(o.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="adm-order-cards">
              {recentOrders.map(o => (
                <div key={o.id} className="adm-order-card">
                  <div className="adm-order-card-top">
                    <span className="adm-order-card-id">#{o.id.slice(0, 8).toUpperCase()}</span>
                    {STATUS_BADGE[o.status] ?? <span className="adm-badge adm-badge--gray">{o.status}</span>}
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
