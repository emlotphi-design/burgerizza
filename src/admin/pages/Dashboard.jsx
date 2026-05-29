import { useEffect, useRef, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  fetchDashboardStats, fetchTodayStats, fetchRevenueByDay,
  fetchStatusBreakdown, fetchTopItems, subscribeToOrders,
} from '../services/adminService';

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

function fmtDay(isoDate) {
  const d = new Date(isoDate + 'T12:00:00');
  return d.toLocaleDateString('en-GB', { weekday: 'short' });
}

function itemsSummary(items) {
  if (!Array.isArray(items) || !items.length) return '—';
  return items.map(i => {
    const label = i.name || i.type || 'Item';
    const qty   = i.quantity ?? 1;
    return qty > 1 ? `${label} ×${qty}` : label;
  }).slice(0, 2).join(', ') + (items.length > 2 ? ` +${items.length - 2}` : '');
}

/* ── Status config ─────────────────────────────────────────── */
const STATUS_CONFIG = {
  pending:   { label: 'Pending',          color: '#818cf8', badge: 'adm-badge--indigo' },
  confirmed: { label: 'Confirmed',        color: '#60a5fa', badge: 'adm-badge--blue'   },
  preparing: { label: 'Preparing',        color: '#fbbf24', badge: 'adm-badge--amber'  },
  ready:     { label: 'Out for delivery', color: '#fb923c', badge: 'adm-badge--orange' },
  delivered: { label: 'Delivered',        color: '#4ade80', badge: 'adm-badge--green'  },
  cancelled: { label: 'Cancelled',        color: '#f87171', badge: 'adm-badge--red'    },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status];
  if (!cfg) return <span className="adm-badge adm-badge--gray">{status}</span>;
  return <span className={`adm-badge ${cfg.badge}`}>{cfg.label}</span>;
}

/* ── Inline SVG bar chart ──────────────────────────────────── */
function RevenueChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ height: 134, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'var(--adm-text-3)', fontSize: 12 }}>No revenue data</span>
      </div>
    );
  }
  const max = Math.max(...data.map(d => d.revenue), 0.01);
  const W = 560;
  const H = 110;
  const barCount = data.length;
  const barW = Math.floor((W - (barCount - 1) * 8) / barCount);
  const gap = 8;

  return (
    <div>
      <svg
        className="adm-bar-chart"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        style={{ width: '100%', height: 110 }}
      >
        {data.map((d, i) => {
          const barH = Math.max((d.revenue / max) * (H - 20), d.orders > 0 ? 4 : 2);
          const x    = i * (barW + gap);
          const y    = H - barH;
          const isToday = i === data.length - 1;
          return (
            <g key={d.date}>
              <rect
                x={x} y={y} width={barW} height={barH}
                rx={4}
                fill={isToday ? '#FFD23F' : 'rgba(255,255,255,0.12)'}
                style={{ transition: 'fill 0.2s' }}
              />
              {d.revenue > 0 && (
                <text
                  x={x + barW / 2} y={y - 5}
                  textAnchor="middle"
                  fontSize="9"
                  fill={isToday ? '#FFD23F' : 'rgba(255,255,255,0.30)'}
                  fontWeight="700"
                  fontFamily="Nunito,sans-serif"
                >
                  €{d.revenue >= 1000
                    ? (d.revenue / 1000).toFixed(1) + 'k'
                    : d.revenue.toFixed(0)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="adm-bar-chart-labels">
        {data.map((d, i) => (
          <span
            key={d.date}
            className="adm-bar-chart-label"
            style={{ color: i === data.length - 1 ? '#FFD23F' : undefined }}
          >
            {fmtDay(d.date)}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Sparkline ─────────────────────────────────────────────── */
function Sparkline({ data, color }) {
  if (!data || data.length < 2) return null;
  const max  = Math.max(...data, 0.01);
  const W = 80;
  const H = 28;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - (v / max) * (H - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: 80, height: 28, overflow: 'visible' }}>
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.7"
      />
    </svg>
  );
}

/* ════════════════════════════════════════════════════════════
   DASHBOARD PAGE
════════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const [allStats,    setAllStats]    = useState(null);
  const [todayStats,  setTodayStats]  = useState(null);
  const [chartData,   setChartData]   = useState([]);
  const [statusBreak, setStatusBreak] = useState({});
  const [topItems,    setTopItems]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const channelRef = useRef(null);

  async function load() {
    try {
      const [all, today, chart, status, top] = await Promise.all([
        fetchDashboardStats(),
        fetchTodayStats(),
        fetchRevenueByDay(7),
        fetchStatusBreakdown(),
        fetchTopItems(5),
      ]);
      setAllStats(all);
      setTodayStats(today);
      setChartData(chart);
      setStatusBreak(status);
      setTopItems(top);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    channelRef.current = subscribeToOrders(({ eventType }) => {
      if (eventType === 'INSERT' || eventType === 'UPDATE') load();
    }, 'admin-orders-dashboard');
    return () => { channelRef.current?.unsubscribe(); };
  }, []);

  /* Sparkline data from chart (revenue per day) */
  const sparkRevenue = chartData.map(d => d.revenue);
  const sparkOrders  = chartData.map(d => d.orders);

  /* Status bar max for proportional widths */
  const statusMax = useMemo(
    () => Math.max(...Object.values(statusBreak), 1),
    [statusBreak]
  );

  const topCards = [
    {
      label:     'Today Revenue',
      value:     loading ? '…' : fmtCurrency(todayStats?.todayRevenue ?? 0),
      footer:    'Completed orders',
      cardClass: 'adm-stat-card--amber',
      iconClass: 'adm-stat-icon--amber',
      sparkData: sparkRevenue,
      sparkColor:'#FFD23F',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23"/>
          <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
        </svg>
      ),
    },
    {
      label:     'Today Orders',
      value:     loading ? '…' : (todayStats?.todayOrders ?? 0),
      footer:    'Last 24h',
      cardClass: 'adm-stat-card--blue',
      iconClass: 'adm-stat-icon--blue',
      sparkData: sparkOrders,
      sparkColor:'#60a5fa',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <path d="M16 10a4 4 0 01-8 0"/>
        </svg>
      ),
    },
    {
      label:     'Active Orders',
      value:     loading ? '…' : (todayStats?.activeOrders ?? 0),
      footer:    'Pending + In progress',
      cardClass: todayStats?.activeOrders > 0 ? 'adm-stat-card--orange' : 'adm-stat-card--green',
      iconClass: todayStats?.activeOrders > 0 ? 'adm-stat-icon--orange' : 'adm-stat-icon--green',
      sparkData: null,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      ),
    },
    {
      label:     'Avg Order Value',
      value:     loading ? '…' : fmtCurrency(todayStats?.avgOrderValue ?? 0),
      footer:    'All time average',
      cardClass: 'adm-stat-card--purple',
      iconClass: 'adm-stat-icon--purple',
      sparkData: null,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
        </svg>
      ),
    },
  ];

  const recentOrders = allStats?.recentOrders ?? [];

  return (
    <>
      {/* ── Header ── */}
      <div className="adm-page-header">
        <div className="adm-page-header-left">
          <h1 className="adm-page-title">Dashboard</h1>
          <p className="adm-page-subtitle">
            Burgerizza Operations
            <span className="adm-live-indicator">
              <span className="adm-live-dot" />
              LIVE
            </span>
          </p>
        </div>
      </div>

      {error && (
        <div className="adm-card" style={{ marginBottom: 16, color: 'var(--adm-red)', fontSize: 13, padding: '14px 18px' }}>
          Failed to load: {error}
        </div>
      )}

      {/* ── Stat cards ── */}
      <div className="adm-stats-grid">
        {topCards.map(s => (
          <div key={s.label} className={`adm-card adm-stat-card ${s.cardClass}`}>
            <div className="adm-stat-top">
              <div className={`adm-stat-icon ${s.iconClass}`}>{s.icon}</div>
              {s.sparkData && s.sparkData.some(v => v > 0) && (
                <Sparkline data={s.sparkData} color={s.sparkColor} />
              )}
            </div>
            <div className="adm-stat-value">{s.value}</div>
            <div className="adm-stat-label">{s.label}</div>
            <div className="adm-stat-footer">{s.footer}</div>
          </div>
        ))}
      </div>

      {/* ── Charts row ── */}
      <div className="adm-grid-2 adm-grid-2--3-2">

        {/* Revenue chart */}
        <div className="adm-card" style={{ marginBottom: 0 }}>
          <div className="adm-chart-wrap">
            <div className="adm-chart-title">Revenue — Last 7 Days</div>
            <div className="adm-chart-sub">Excluding cancelled orders · Today highlighted</div>
            {loading ? (
              <div style={{ height: 110 + 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: 'var(--adm-text-3)', fontSize: 12 }}>Loading chart…</span>
              </div>
            ) : (
              <RevenueChart data={chartData} />
            )}
          </div>
        </div>

        {/* Status breakdown */}
        <div className="adm-card" style={{ marginBottom: 0 }}>
          <div className="adm-section-head">
            <span className="adm-section-title">Orders by Status</span>
            <Link to="/admin/orders" className="adm-section-action">View all →</Link>
          </div>
          {loading ? (
            <div className="adm-empty" style={{ padding: '28px 22px' }}>
              <div className="adm-empty-sub">Loading…</div>
            </div>
          ) : (
            <div className="adm-status-list">
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                const count = statusBreak[key] ?? 0;
                if (count === 0 && !['pending', 'preparing'].includes(key)) return null;
                return (
                  <div key={key} className="adm-status-row">
                    <span className="adm-status-row-dot" style={{ background: cfg.color }} />
                    <span className="adm-status-row-label">{cfg.label}</span>
                    <div className="adm-status-row-bar-wrap">
                      <div
                        className="adm-status-row-bar"
                        style={{
                          width: `${(count / statusMax) * 100}%`,
                          background: cfg.color,
                        }}
                      />
                    </div>
                    <span className="adm-status-row-count">{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom row: recent orders + top items ── */}
      <div className="adm-grid-2 adm-grid-2--3-2" style={{ marginTop: 16 }}>

        {/* Recent orders */}
        <div className="adm-card" style={{ marginBottom: 0 }}>
          <div className="adm-section-head">
            <span className="adm-section-title">Recent Orders</span>
            <Link to="/admin/orders" className="adm-section-action">View all →</Link>
          </div>
          {loading ? (
            <div>
              {[1,2,3,4].map(i => (
                <div key={i} className="adm-skeleton-row">
                  <div className="adm-skeleton adm-skeleton-avatar" />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div className="adm-skeleton adm-skeleton-line" style={{ width: '60%' }} />
                    <div className="adm-skeleton adm-skeleton-line" style={{ width: '40%' }} />
                  </div>
                  <div className="adm-skeleton adm-skeleton-line" style={{ width: 60 }} />
                </div>
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="adm-empty" style={{ padding: '32px 24px' }}>
              <div className="adm-empty-emoji">📭</div>
              <div className="adm-empty-title">No orders yet</div>
            </div>
          ) : (
            <>
              {/* Desktop table */}
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
                        <td style={{ fontWeight: 900, fontFamily: 'Courier New, monospace', fontSize: 11, letterSpacing: 0.5, color: 'var(--adm-text-2)' }}>
                          #{o.id.slice(0,8).toUpperCase()}
                        </td>
                        <td>
                          <div style={{ fontWeight: 800 }}>{o.customer_name || '—'}</div>
                          <div className="adm-table-muted">{o.customer_email || ''}</div>
                        </td>
                        <td className="adm-table-muted">{itemsSummary(o.items)}</td>
                        <td style={{ fontWeight: 900 }}>{fmtCurrency(o.total_price)}</td>
                        <td><StatusBadge status={o.status} /></td>
                        <td className="adm-table-muted">{fmtDate(o.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile cards */}
              <div className="adm-order-cards">
                {recentOrders.map(o => (
                  <div key={o.id} className="adm-order-card">
                    <div className="adm-order-card-top">
                      <span className="adm-order-card-id">#{o.id.slice(0,8).toUpperCase()}</span>
                      <StatusBadge status={o.status} />
                    </div>
                    <div className="adm-order-card-customer">{o.customer_name || '—'}</div>
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

        {/* Top items */}
        <div className="adm-card" style={{ marginBottom: 0 }}>
          <div className="adm-section-head">
            <span className="adm-section-title">Top Items</span>
            <span className="adm-table-muted" style={{ fontSize: 11 }}>All time</span>
          </div>
          {loading ? (
            <div className="adm-empty" style={{ padding: '28px 22px' }}>
              <div className="adm-empty-sub">Loading…</div>
            </div>
          ) : topItems.length === 0 ? (
            <div className="adm-empty" style={{ padding: '32px 24px' }}>
              <div className="adm-empty-emoji">🍕</div>
              <div className="adm-empty-title">No data yet</div>
            </div>
          ) : (
            <div>
              {topItems.map((item, i) => (
                <div key={item.name} className="adm-top-item">
                  <span className="adm-top-item-rank">{i + 1}</span>
                  <span className="adm-top-item-emoji">
                    {item.name.toLowerCase().includes('burger') ? '🍔' : '🍕'}
                  </span>
                  <span className="adm-top-item-name">{item.name}</span>
                  <span className="adm-top-item-count">×{item.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </>
  );
}
