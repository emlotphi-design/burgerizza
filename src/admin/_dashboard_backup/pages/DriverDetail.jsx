import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchDriverById, fetchDriverHistory } from '../services/adminService';

/* ── Constants ─────────────────────────────────────────────── */
const VEHICLE_ICON  = { scooter: '🛵', bicycle: '🚲', car: '🚗' };
const VEHICLE_LABEL = { scooter: 'Scooter', bicycle: 'Bicycle', car: 'Car' };

const PERIODS = [
  { key: 'today', label: 'Today' },
  { key: 'week',  label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'all',   label: 'All Time' },
];

const STATUS_CONFIG = {
  pending:   { label: 'Pending',          badge: 'adm-badge--indigo' },
  confirmed: { label: 'Confirmed',        badge: 'adm-badge--blue'   },
  preparing: { label: 'Preparing',        badge: 'adm-badge--amber'  },
  ready:     { label: 'Out for delivery', badge: 'adm-badge--orange' },
  delivered: { label: 'Delivered',        badge: 'adm-badge--green'  },
  cancelled: { label: 'Cancelled',        badge: 'adm-badge--red'    },
};

/* ── Helpers ───────────────────────────────────────────────── */
function fmtDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function fmtCurrency(n) {
  return '€' + Number(n).toFixed(2);
}

function fmtAddress(addr) {
  if (!addr) return '—';
  if (typeof addr === 'string') return addr;
  const { street, house_number, postal_code, city } = addr;
  if (street) return [street, house_number, postal_code, city].filter(Boolean).join(' ');
  return '—';
}

function itemsSummary(items) {
  if (!Array.isArray(items) || !items.length) return '—';
  const parts = items.slice(0, 3).map(i => {
    const label = i.name || i.type || 'Item';
    const qty   = i.quantity ?? 1;
    return qty > 1 ? `${label} ×${qty}` : label;
  });
  return parts.join(', ') + (items.length > 3 ? ` +${items.length - 3}` : '');
}

function getDateBounds() {
  const now = new Date();
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const weekStart  = new Date(now); weekStart.setDate(now.getDate() - now.getDay()); weekStart.setHours(0, 0, 0, 0);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  return { todayStart, weekStart, monthStart };
}

/* ── StatCard ──────────────────────────────────────────────── */
function StatCard({ label, value, icon, cardClass, iconClass, footer }) {
  return (
    <div className={`adm-card adm-stat-card ${cardClass}`}>
      <div className="adm-stat-top">
        <div className={`adm-stat-icon ${iconClass}`}>{icon}</div>
      </div>
      <div className="adm-stat-value">{value}</div>
      <div className="adm-stat-label">{label}</div>
      {footer && <div className="adm-stat-footer">{footer}</div>}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   DRIVER DETAIL PAGE
════════════════════════════════════════════════════════════ */
export default function DriverDetail() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const [driver,   setDriver]   = useState(null);
  const [history,  setHistory]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [period,   setPeriod]   = useState('all');

  useEffect(() => {
    if (!id) return;
    load();
  }, [id]);

  async function load() {
    setLoading(true); setError(null);
    try {
      const [driverData, historyData] = await Promise.all([
        fetchDriverById(id),
        fetchDriverHistory(id),
      ]);
      setDriver(driverData);
      setHistory(historyData);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  /* Compute stats from full history */
  const stats = useMemo(() => {
    if (!history.length) return { today: 0, thisWeek: 0, thisMonth: 0, total: 0, totalRevenue: 0, avgPerDay: 0 };
    const { todayStart, weekStart, monthStart } = getDateBounds();
    const delivered = history.filter(a => a.orders?.status === 'delivered');

    let today = 0, thisWeek = 0, thisMonth = 0;
    for (const a of delivered) {
      const at = new Date(a.assigned_at);
      if (at >= todayStart) today++;
      if (at >= weekStart)  thisWeek++;
      if (at >= monthStart) thisMonth++;
    }

    const totalRevenue = delivered.reduce((s, a) => s + Number(a.orders?.total_price ?? 0), 0);

    // Avg per day: total delivered / days since first assignment (min 1)
    let avgPerDay = 0;
    if (delivered.length > 0) {
      const sorted    = [...delivered].sort((a, b) => new Date(a.assigned_at) - new Date(b.assigned_at));
      const firstDate = new Date(sorted[0].assigned_at);
      const daysSince = Math.max(1, Math.ceil((Date.now() - firstDate.getTime()) / 86400000));
      avgPerDay = delivered.length / daysSince;
    }

    return { today, thisWeek, thisMonth, total: delivered.length, totalRevenue, avgPerDay };
  }, [history]);

  /* Filter history by selected period */
  const filteredHistory = useMemo(() => {
    if (period === 'all') return history;
    const { todayStart, weekStart, monthStart } = getDateBounds();
    const bound =
      period === 'today' ? todayStart :
      period === 'week'  ? weekStart  :
      period === 'month' ? monthStart : null;
    if (!bound) return history;
    return history.filter(a => new Date(a.assigned_at) >= bound);
  }, [history, period]);

  if (loading) {
    return (
      <div className="adm-empty" style={{ marginTop: 60 }}>
        <div className="adm-empty-sub">Loading driver data…</div>
      </div>
    );
  }

  if (error || !driver) {
    return (
      <div>
        <div className="adm-card" style={{ marginBottom: 16, color: 'var(--adm-danger,#e03d3d)', fontSize: 13, padding: '14px 18px' }}>
          {error ?? 'Driver not found.'}
        </div>
        <button className="adm-btn adm-btn--ghost" onClick={() => navigate('/admin/drivers')}>
          ← Back to Drivers
        </button>
      </div>
    );
  }

  return (
    <>
      {/* ── Header ── */}
      <div className="adm-page-header" style={{ alignItems: 'flex-start' }}>
        <div className="adm-page-header-left">
          <button
            className="adm-btn adm-btn--ghost"
            style={{ height: 32, padding: '0 10px', fontSize: 12, marginBottom: 10 }}
            onClick={() => navigate('/admin/drivers')}
          >
            ← Back
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: 'var(--adm-surface-4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26, flexShrink: 0,
            }}>
              {VEHICLE_ICON[driver.vehicle_type] ?? '🛵'}
            </div>
            <div>
              <h1 className="adm-page-title" style={{ marginBottom: 2 }}>{driver.full_name}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, color: 'var(--adm-text-2)' }}>
                  {VEHICLE_LABEL[driver.vehicle_type] ?? driver.vehicle_type}
                </span>
                {driver.phone && (
                  <span style={{ fontSize: 13, color: 'var(--adm-text-3)' }}>· {driver.phone}</span>
                )}
                {driver.email && (
                  <span style={{ fontSize: 13, color: 'var(--adm-text-3)' }}>· {driver.email}</span>
                )}
                {driver.is_active
                  ? <span className="adm-badge adm-badge--green">Active</span>
                  : <span className="adm-badge adm-badge--gray">Inactive</span>
                }
              </div>
              {driver.notes && (
                <div style={{ fontSize: 12, color: 'var(--adm-text-3)', marginTop: 3 }}>{driver.notes}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats cards ── */}
      <div className="adm-stats-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', marginBottom: 20 }}>
        <StatCard
          label="Total Delivered"
          value={stats.total}
          cardClass="adm-stat-card--amber"
          iconClass="adm-stat-icon--amber"
          footer={`avg ${stats.avgPerDay.toFixed(1)}/day`}
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
        />
        <StatCard
          label="This Month"
          value={stats.thisMonth}
          cardClass="adm-stat-card--purple"
          iconClass="adm-stat-icon--purple"
          footer="delivered orders"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
        />
        <StatCard
          label="This Week"
          value={stats.thisWeek}
          cardClass="adm-stat-card--blue"
          iconClass="adm-stat-icon--blue"
          footer="delivered orders"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
        />
        <StatCard
          label="Today"
          value={stats.today}
          cardClass="adm-stat-card--green"
          iconClass="adm-stat-icon--green"
          footer="delivered orders"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
        />
        <StatCard
          label="Total Revenue"
          value={stats.total > 0 ? fmtCurrency(stats.totalRevenue) : '—'}
          cardClass="adm-stat-card--orange"
          iconClass="adm-stat-icon--orange"
          footer="from delivered orders"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>}
        />
      </div>

      {/* ── Delivery History ── */}
      <div className="adm-card">
        <div className="adm-section-head" style={{ flexWrap: 'wrap', gap: 8 }}>
          <span className="adm-section-title">Delivery History</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
            <span className="adm-table-muted" style={{ fontSize: 12, fontWeight: 700 }}>
              {filteredHistory.length} assignments
            </span>
            {/* Period filter tabs */}
            <div style={{ display: 'flex', gap: 2, background: 'var(--adm-surface-4)', borderRadius: 8, padding: 2 }}>
              {PERIODS.map(p => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setPeriod(p.key)}
                  style={{
                    padding: '4px 9px', fontSize: 11, fontWeight: 800, borderRadius: 6,
                    border: 'none', cursor: 'pointer',
                    background: period === p.key ? 'var(--adm-accent)' : 'transparent',
                    color:      period === p.key ? 'var(--adm-accent-text)' : 'var(--adm-text-2)',
                    transition: 'background 0.12s ease, color 0.12s ease',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="adm-empty">
            <div className="adm-empty-emoji">📦</div>
            <div className="adm-empty-title">No deliveries found</div>
            <div className="adm-empty-sub">
              {period !== 'all' ? 'Try a wider time range.' : 'Assignments will appear here once orders are dispatched.'}
            </div>
          </div>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Date &amp; Time</th>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Address</th>
                  <th>Items</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map(a => {
                  const o   = a.orders;
                  const cfg = STATUS_CONFIG[o?.status] ?? {};
                  return (
                    <tr key={a.id}>
                      <td className="adm-table-muted" style={{ whiteSpace: 'nowrap', fontSize: 12 }}>
                        {fmtDateTime(a.assigned_at)}
                      </td>
                      <td style={{ fontSize: 11, color: 'var(--adm-text-3)', fontFamily: 'monospace' }}>
                        {o?.id?.slice(0, 8).toUpperCase() ?? '—'}
                      </td>
                      <td style={{ fontWeight: 700 }}>{o?.customer_name || '—'}</td>
                      <td className="adm-table-muted" style={{ fontSize: 12, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {fmtAddress(o?.delivery_address)}
                      </td>
                      <td className="adm-table-muted" style={{ fontSize: 12 }}>
                        {itemsSummary(o?.items)}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 800 }}>
                        {o?.total_price ? fmtCurrency(o.total_price) : '—'}
                      </td>
                      <td>
                        {o?.status ? (
                          <span className={`adm-badge ${cfg.badge ?? 'adm-badge--gray'}`}>
                            {cfg.label ?? o.status}
                          </span>
                        ) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
