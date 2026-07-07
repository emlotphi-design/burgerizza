import { useEffect, useMemo, useState } from 'react';
import {
  fetchAnalyticsOverview, fetchSalesTimeseries, fetchBestSellers,
  fetchTopCustomers, fetchInventoryAnalytics, fetchLowStockEvents,
  fetchStockHistory,
} from '../services/adminService';
import { TIME_FILTERS, resolveDateRange, granularityFor } from '../utils/dateRanges';
import '../styles/dashboard-shared.css';
import '../styles/analytics.css';

function fmtCurrency(n) {
  return '€' + Number(n ?? 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function fmtBucket(iso, granularity) {
  const d = new Date(iso);
  if (granularity === 'hour')  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  if (granularity === 'month') return d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

/* ── Sales timeseries — inline SVG bar chart, granularity-aware labels ── */
function SalesChart({ data, granularity }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ height: 134, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'var(--adm-text-3)', fontSize: 12 }}>No revenue in this range</span>
      </div>
    );
  }
  const max = Math.max(...data.map(d => Number(d.revenue)), 0.01);
  const W = 700;
  const H = 130;
  const barCount = data.length;
  const gap = barCount > 20 ? 2 : 8;
  const barW = Math.max(2, Math.floor((W - (barCount - 1) * gap) / barCount));

  return (
    <div>
      <svg className="adm-bar-chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: 130 }}>
        <defs>
          <linearGradient id="ana-bar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="var(--adm-chart-bar-other)" stopOpacity="0.85" />
            <stop offset="100%" stopColor="var(--adm-chart-bar-other)" stopOpacity="0.30" />
          </linearGradient>
        </defs>
        {data.map((d, i) => {
          const barH = Math.max((Number(d.revenue) / max) * (H - 24), Number(d.order_count) > 0 ? 4 : 2);
          const x = i * (barW + gap);
          const y = H - barH;
          return (
            <rect key={d.bucket} x={x} y={y} width={barW} height={barH} rx={Math.min(4, barW / 3)} fill="url(#ana-bar)">
              <title>{fmtBucket(d.bucket, granularity)}: {fmtCurrency(d.revenue)} · {d.order_count} orders</title>
            </rect>
          );
        })}
      </svg>
      {barCount <= 31 && (
        <div className="adm-bar-chart-labels">
          {data.map(d => (
            <span key={d.bucket} className="adm-bar-chart-label">{fmtBucket(d.bucket, granularity)}</span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Simple horizontal breakdown bars (Delivery vs Pickup, Payment Method) ── */
function BreakdownBars({ rows }) {
  const max = Math.max(...rows.map(r => r.count), 1);
  return (
    <div className="adm-status-list">
      {rows.map(r => (
        <div key={r.label} className="adm-status-row">
          <span className="adm-status-row-dot" style={{ background: r.color }} />
          <span className="adm-status-row-label">{r.label}</span>
          <div className="adm-status-row-bar-wrap">
            <div className="adm-status-row-bar" style={{ width: `${(r.count / max) * 100}%`, background: r.color }} />
          </div>
          <span className="adm-status-row-count">{r.count}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Stock History — pick an item, see its reconstructed stock over time ── */
function StockHistoryPanel({ items, from, to }) {
  const [itemId, setItemId] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!itemId) { setHistory([]); return; }
    setLoading(true);
    fetchStockHistory(itemId, from, to)
      .then(setHistory)
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, [itemId, from, to]);

  return (
    <div>
      <select className="adm-select adm-input" value={itemId} onChange={e => setItemId(e.target.value)} style={{ marginBottom: 12, maxWidth: 320 }}>
        <option value="">Select an item…</option>
        {items.map(i => <option key={i.inventory_item_id} value={i.inventory_item_id}>{i.item_name}</option>)}
      </select>
      {!itemId ? (
        <p className="adm-table-muted" style={{ fontSize: 13 }}>Pick an item to see its stock level over time.</p>
      ) : loading ? (
        <p className="adm-table-muted" style={{ fontSize: 13 }}>Loading…</p>
      ) : history.length === 0 ? (
        <p className="adm-table-muted" style={{ fontSize: 13 }}>No stock movements in this range.</p>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>When</th><th>Reason</th><th>Change</th><th>Stock After</th></tr></thead>
            <tbody>
              {history.slice(-30).reverse().map((h, i) => (
                <tr key={i}>
                  <td className="adm-table-muted">{new Date(h.at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                  <td>{h.reason}</td>
                  <td style={{ color: Number(h.change_amount) < 0 ? 'var(--adm-red)' : 'var(--adm-green)' }}>
                    {Number(h.change_amount) > 0 ? '+' : ''}{Number(h.change_amount).toLocaleString()}
                  </td>
                  <td style={{ fontWeight: 700 }}>{Number(h.stock_level).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   ANALYTICS PAGE
════════════════════════════════════════════════════════════ */
export default function Analytics() {
  const [filter, setFilter] = useState('today');
  const [customRange, setCustomRange] = useState({ from: '', to: '' });

  const [overview, setOverview]         = useState(null);
  const [timeseries, setTimeseries]     = useState([]);
  const [bestSellers, setBestSellers]   = useState({ products: [], categories: [] });
  const [topCustomers, setTopCustomers] = useState([]);
  const [invAnalytics, setInvAnalytics] = useState([]);
  const [lowStockEvents, setLowStockEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const { from, to } = useMemo(
    () => resolveDateRange(filter, { from: customRange.from ? new Date(customRange.from) : null, to: customRange.to ? new Date(customRange.to) : null }),
    [filter, customRange.from, customRange.to],
  );
  const granularity = granularityFor(filter);

  useEffect(() => {
    if (filter === 'custom' && (!customRange.from || !customRange.to)) return;
    let cancelled = false;
    async function load() {
      setLoading(true); setError(null);
      try {
        const [ov, ts, bs, tc, inv, lse] = await Promise.all([
          fetchAnalyticsOverview(from, to),
          fetchSalesTimeseries(from, to, granularity),
          fetchBestSellers(from, to, 10),
          fetchTopCustomers(from, to, 10),
          fetchInventoryAnalytics(from, to),
          fetchLowStockEvents(from, to),
        ]);
        if (cancelled) return;
        setOverview(ov);
        setTimeseries(ts);
        setBestSellers(bs);
        setTopCustomers(tc);
        setInvAnalytics(inv);
        setLowStockEvents(lse);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, from.getTime(), to.getTime()]);

  const deliveryRows = overview ? [
    { label: 'Delivery', count: Number(overview.delivery_count), color: '#3b82f6' },
    { label: 'Pickup',   count: Number(overview.pickup_count),   color: '#22c55e' },
  ] : [];

  const paymentRows = overview ? [
    { label: 'Cash',  count: Number(overview.cash_count),  color: '#22c55e' },
    { label: 'Card',  count: Number(overview.card_count),  color: '#3b82f6' },
    { label: 'Other', count: Number(overview.other_payment_count), color: '#a855f7' },
  ] : [];

  const statCards = [
    { label: 'Revenue',         value: fmtCurrency(overview?.revenue) },
    { label: 'Profit',          value: fmtCurrency(overview?.profit) },
    { label: 'Costs',           value: fmtCurrency(overview?.costs) },
    { label: 'Orders',          value: overview ? Number(overview.order_count) : 0 },
    { label: 'Avg Order Value', value: fmtCurrency(overview?.avg_order_value) },
  ];

  return (
    <div className="dash-page">
      <div className="adm-page-header">
        <h1 className="adm-page-title">Analytics</h1>
        <p className="adm-page-subtitle">Revenue, orders, best sellers and inventory — computed from permanent order history.</p>
      </div>

      {/* ── Time filter bar ── */}
      <div className="ana-filter-bar">
        {TIME_FILTERS.map(f => (
          <button
            key={f.value}
            type="button"
            className={`ana-filter-chip${filter === f.value ? ' ana-filter-chip--active' : ''}`}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>
      {filter === 'custom' && (
        <div className="ana-custom-range">
          <label>From <input type="date" className="adm-input" value={customRange.from} onChange={e => setCustomRange(r => ({ ...r, from: e.target.value }))} /></label>
          <label>To <input type="date" className="adm-input" value={customRange.to} onChange={e => setCustomRange(r => ({ ...r, to: e.target.value }))} /></label>
        </div>
      )}

      {error && (
        <div className="adm-card" style={{ marginBottom: 16, color: 'var(--adm-red)', fontSize: 13, padding: '14px 18px' }}>
          Failed to load: {error}
        </div>
      )}

      {/* ── Overview stat cards ── */}
      <div className="adm-stats-grid">
        {statCards.map(s => (
          <div key={s.label} className="adm-card adm-stat-card">
            <div className="adm-stat-value">{loading ? '…' : s.value}</div>
            <div className="adm-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Sales chart + breakdowns ── */}
      <div className="adm-grid-2 adm-grid-2--3-2">
        <div className="adm-card" style={{ marginBottom: 0 }}>
          <div className="adm-chart-wrap">
            <div className="adm-chart-title">Sales</div>
            <div className="adm-chart-sub">Excluding cancelled orders · bucketed by {granularity}</div>
            {loading ? (
              <div style={{ height: 134, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: 'var(--adm-text-3)', fontSize: 12 }}>Loading chart…</span>
              </div>
            ) : (
              <SalesChart data={timeseries} granularity={granularity} />
            )}
          </div>
        </div>
        <div className="adm-card" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <div className="adm-section-head"><span className="adm-section-title">Delivery vs Pickup</span></div>
            {overview && <BreakdownBars rows={deliveryRows} />}
          </div>
          <div>
            <div className="adm-section-head"><span className="adm-section-title">Payment Method</span></div>
            {overview && <BreakdownBars rows={paymentRows} />}
          </div>
        </div>
      </div>

      {/* ── Best sellers ── */}
      <div className="adm-grid-2 adm-grid-2--3-2" style={{ marginTop: 16 }}>
        <div className="adm-card" style={{ marginBottom: 0 }}>
          <div className="adm-section-head"><span className="adm-section-title">Best Selling Products</span></div>
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead><tr><th>Product</th><th>Qty Sold</th><th>Revenue</th></tr></thead>
              <tbody>
                {bestSellers.products.length === 0 ? (
                  <tr><td colSpan={3} className="adm-table-muted">No sales in this range</td></tr>
                ) : bestSellers.products.map(p => (
                  <tr key={p.product_name}>
                    <td>{p.product_name}</td>
                    <td>{Number(p.qty_sold).toLocaleString()}</td>
                    <td style={{ fontWeight: 700 }}>{fmtCurrency(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="adm-card" style={{ marginBottom: 0 }}>
          <div className="adm-section-head"><span className="adm-section-title">Best Selling Categories</span></div>
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead><tr><th>Category</th><th>Qty Sold</th><th>Revenue</th></tr></thead>
              <tbody>
                {bestSellers.categories.length === 0 ? (
                  <tr><td colSpan={3} className="adm-table-muted">No sales in this range</td></tr>
                ) : bestSellers.categories.map(c => (
                  <tr key={c.product_type}>
                    <td style={{ textTransform: 'capitalize' }}>{c.product_type}</td>
                    <td>{Number(c.qty_sold).toLocaleString()}</td>
                    <td style={{ fontWeight: 700 }}>{fmtCurrency(c.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Top customers ── */}
      <div className="adm-card" style={{ marginTop: 16 }}>
        <div className="adm-section-head"><span className="adm-section-title">Top Customers</span></div>
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Customer</th><th>Contact</th><th>Orders</th><th>Total Spent</th></tr></thead>
            <tbody>
              {topCustomers.length === 0 ? (
                <tr><td colSpan={4} className="adm-table-muted">No customers in this range</td></tr>
              ) : topCustomers.map((c, i) => (
                <tr key={i}>
                  <td>{c.customer_name || '—'}</td>
                  <td className="adm-table-muted">{c.customer_contact || '—'}</td>
                  <td>{c.order_count}</td>
                  <td style={{ fontWeight: 700 }}>{fmtCurrency(c.total_spent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Inventory analytics ── */}
      <div className="adm-card" style={{ marginTop: 16 }}>
        <div className="adm-section-head"><span className="adm-section-title">Ingredient Consumption &amp; Inventory Usage</span></div>
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Item</th><th>Consumed</th><th>Wasted</th><th>Received</th><th>Current Stock</th></tr></thead>
            <tbody>
              {invAnalytics.length === 0 ? (
                <tr><td colSpan={5} className="adm-table-muted">No inventory movement in this range</td></tr>
              ) : invAnalytics.map(i => (
                <tr key={i.inventory_item_id}>
                  <td>{i.item_name}</td>
                  <td>{Number(i.consumed).toLocaleString()} {i.unit}</td>
                  <td style={{ color: Number(i.wasted) > 0 ? 'var(--adm-red)' : undefined }}>{Number(i.wasted).toLocaleString()} {i.unit}</td>
                  <td>{Number(i.received).toLocaleString()} {i.unit}</td>
                  <td style={{ fontWeight: 700 }}>{Number(i.current_stock).toLocaleString()} {i.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="adm-grid-2 adm-grid-2--3-2" style={{ marginTop: 16 }}>
        <div className="adm-card" style={{ marginBottom: 0 }}>
          <div className="adm-section-head"><span className="adm-section-title">Stock History</span></div>
          <StockHistoryPanel items={invAnalytics} from={from} to={to} />
        </div>
        <div className="adm-card" style={{ marginBottom: 0 }}>
          <div className="adm-section-head"><span className="adm-section-title">Low Stock History</span></div>
          {lowStockEvents.length === 0 ? (
            <p className="adm-table-muted" style={{ fontSize: 13 }}>No low-stock crossings in this range.</p>
          ) : (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead><tr><th>Item</th><th>When</th><th>Stock</th><th>Minimum</th></tr></thead>
                <tbody>
                  {lowStockEvents.slice(0, 30).map((e, i) => (
                    <tr key={i}>
                      <td>{e.item_name}</td>
                      <td className="adm-table-muted">{new Date(e.at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                      <td style={{ color: 'var(--adm-red)', fontWeight: 700 }}>{Number(e.stock_level).toLocaleString()}</td>
                      <td className="adm-table-muted">{Number(e.minimum_stock).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
