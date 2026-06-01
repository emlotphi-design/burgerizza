import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchAllDrivers, createDriver, updateDriver, toggleDriverActive,
  fetchAssignmentsWithOrders,
} from '../services/adminService';

/* ── Constants ─────────────────────────────────────────────── */
const VEHICLE_OPTIONS = [
  { value: 'scooter', label: 'Scooter', icon: '🛵' },
  { value: 'bicycle', label: 'Bicycle', icon: '🚲' },
  { value: 'car',     label: 'Car',     icon: '🚗' },
];
const VEHICLE_ICON = { scooter: '🛵', bicycle: '🚲', car: '🚗' };
const EMPTY_FORM   = {
  full_name: '', phone: '', email: '',
  vehicle_type: 'scooter', notes: '', is_active: true,
};
const PERIODS = [
  { key: 'today', label: 'Today' },
  { key: 'week',  label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'all',   label: 'All Time' },
];

/* ── Helpers ───────────────────────────────────────────────── */
function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function fmtCurrency(n) {
  return '€' + Number(n).toFixed(2);
}

function getDateBounds() {
  const now = new Date();
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const weekStart  = new Date(now); weekStart.setDate(now.getDate() - now.getDay()); weekStart.setHours(0, 0, 0, 0);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  return { todayStart, weekStart, monthStart };
}

function computeStats(assignments) {
  const { todayStart, weekStart, monthStart } = getDateBounds();
  const delivered = assignments.filter(a => a.orders?.status === 'delivered');
  const sorted    = [...delivered].sort((a, b) => new Date(b.assigned_at) - new Date(a.assigned_at));

  let today = 0, thisWeek = 0, thisMonth = 0;
  for (const a of delivered) {
    const at = new Date(a.assigned_at);
    if (at >= todayStart) today++;
    if (at >= weekStart)  thisWeek++;
    if (at >= monthStart) thisMonth++;
  }
  return {
    today, thisWeek, thisMonth,
    total:        delivered.length,
    totalRevenue: delivered.reduce((s, a) => s + Number(a.orders?.total_price ?? 0), 0),
    lastDelivery: sorted[0]?.assigned_at ?? null,
  };
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

/* ── DriverModal ───────────────────────────────────────────── */
function DriverModal({ driver, onSave, onClose }) {
  const [form, setForm] = useState(driver ? {
    full_name:    driver.full_name,
    phone:        driver.phone        || '',
    email:        driver.email        || '',
    vehicle_type: driver.vehicle_type || 'scooter',
    notes:        driver.notes        || '',
    is_active:    driver.is_active,
  } : { ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState('');

  function set(field, value) { setForm(p => ({ ...p, [field]: value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.full_name.trim()) { setErr('Name is required.'); return; }
    setSaving(true); setErr('');
    try {
      await onSave(driver?.id ?? null, {
        full_name:    form.full_name.trim(),
        phone:        form.phone.trim(),
        email:        form.email.trim(),
        vehicle_type: form.vehicle_type,
        notes:        form.notes.trim(),
        is_active:    form.is_active,
      });
      onClose();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="adm-modal-overlay" onClick={onClose}>
      <div className="adm-modal-card" onClick={e => e.stopPropagation()}>
        <div className="adm-modal-header">
          <span className="adm-modal-title">{driver ? 'Edit Driver' : 'Add Driver'}</span>
          <button className="adm-modal-close" onClick={onClose}>✕</button>
        </div>
        <form className="adm-modal-body adm-form" onSubmit={handleSubmit}>
          <div className="adm-form-row">
            <label className="adm-form-label">Full name *</label>
            <input className="adm-input" value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="e.g. Ali Hassan" />
          </div>
          <div className="adm-form-2col">
            <div className="adm-form-row">
              <label className="adm-form-label">Phone</label>
              <input className="adm-input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+49 123 456 789" />
            </div>
            <div className="adm-form-row">
              <label className="adm-form-label">Email</label>
              <input className="adm-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="driver@example.com" />
            </div>
          </div>
          <div className="adm-form-row">
            <label className="adm-form-label">Vehicle</label>
            <select className="adm-select adm-input" value={form.vehicle_type} onChange={e => set('vehicle_type', e.target.value)}>
              {VEHICLE_OPTIONS.map(v => <option key={v.value} value={v.value}>{v.icon} {v.label}</option>)}
            </select>
          </div>
          <div className="adm-form-row">
            <label className="adm-form-label">Notes</label>
            <input className="adm-input" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional notes" />
          </div>
          <div className="adm-form-row adm-form-row--inline">
            <label className="adm-form-label">Active</label>
            <button type="button" className={`adm-toggle${form.is_active ? ' adm-toggle--on' : ''}`} onClick={() => set('is_active', !form.is_active)}>
              <span className="adm-toggle-knob" />
            </button>
          </div>
          {err && <div style={{ color: 'var(--adm-danger,#e03d3d)', fontSize: 13 }}>{err}</div>}
          <div className="adm-modal-footer">
            <button type="button" className="adm-btn adm-btn--ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="adm-btn adm-btn--primary" disabled={saving}>
              {saving ? 'Saving…' : driver ? 'Save Changes' : 'Add Driver'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   DRIVERS PAGE
════════════════════════════════════════════════════════════ */
export default function Drivers() {
  const navigate = useNavigate();
  const [drivers,      setDrivers]      = useState([]);
  const [assignments,  setAssignments]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [period,       setPeriod]       = useState('month');
  const [modal,        setModal]        = useState(null);
  const [toggling,     setToggling]     = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true); setError(null);
    try {
      const [driversData, assignData] = await Promise.all([
        fetchAllDrivers(),
        fetchAssignmentsWithOrders(),
      ]);
      setDrivers(driversData);
      setAssignments(assignData);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(id, payload) {
    if (id) {
      const updated = await updateDriver(id, payload);
      setDrivers(prev => prev.map(d => d.id === id ? updated : d));
    } else {
      const created = await createDriver(payload);
      setDrivers(prev => [...prev, created].sort((a, b) => a.full_name.localeCompare(b.full_name)));
    }
  }

  async function handleToggle(driver) {
    setToggling(driver.id);
    try {
      const updated = await toggleDriverActive(driver.id, !driver.is_active);
      setDrivers(prev => prev.map(d => d.id === driver.id ? updated : d));
    } catch (e) {
      alert('Failed: ' + e.message);
    } finally {
      setToggling(null);
    }
  }

  /* Per-driver stats map */
  const statsMap = useMemo(() => {
    const map = {};
    for (const d of drivers) map[d.id] = computeStats(assignments.filter(a => a.driver_id === d.id));
    return map;
  }, [drivers, assignments]);

  /* Top-level overview cards */
  const overview = useMemo(() => {
    const { todayStart, weekStart, monthStart } = getDateBounds();
    const delivered = assignments.filter(a => a.orders?.status === 'delivered');

    let today = 0, thisWeek = 0, thisMonth = 0;
    for (const a of delivered) {
      const at = new Date(a.assigned_at);
      if (at >= todayStart) today++;
      if (at >= weekStart)  thisWeek++;
      if (at >= monthStart) thisMonth++;
    }

    // Best driver this month
    const monthCounts = {};
    for (const a of delivered) {
      if (new Date(a.assigned_at) >= monthStart) {
        monthCounts[a.driver_id] = (monthCounts[a.driver_id] ?? 0) + 1;
      }
    }
    const bestId    = Object.entries(monthCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const bestCount = bestId ? monthCounts[bestId] : 0;
    const bestDriver = bestId ? drivers.find(d => d.id === bestId) : null;

    return {
      activeCount:  drivers.filter(d => d.is_active).length,
      today, thisWeek, thisMonth,
      bestDriver, bestCount,
    };
  }, [assignments, drivers]);

  /* Filtered driver list */
  const filtered = useMemo(() => {
    return drivers.filter(d => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        d.full_name.toLowerCase().includes(q) ||
        (d.phone || '').includes(q) ||
        (d.email || '').toLowerCase().includes(q);
      const matchStatus =
        statusFilter === 'all'      ||
        (statusFilter === 'active'   && d.is_active) ||
        (statusFilter === 'inactive' && !d.is_active);
      return matchSearch && matchStatus;
    });
  }, [drivers, search, statusFilter]);

  /* Which delivery count to show per row based on period */
  function periodCount(driverId) {
    const s = statsMap[driverId];
    if (!s) return 0;
    if (period === 'today') return s.today;
    if (period === 'week')  return s.thisWeek;
    if (period === 'month') return s.thisMonth;
    return s.total;
  }

  const activeCount   = drivers.filter(d => d.is_active).length;
  const inactiveCount = drivers.filter(d => !d.is_active).length;

  return (
    <>
      {modal === 'add' && <DriverModal onSave={handleSave} onClose={() => setModal(null)} />}
      {modal?.driver   && <DriverModal driver={modal.driver} onSave={handleSave} onClose={() => setModal(null)} />}

      {/* ── Header ── */}
      <div className="adm-page-header">
        <div className="adm-page-header-left">
          <h1 className="adm-page-title">Drivers</h1>
          <p className="adm-page-subtitle">Delivery pool management &amp; performance</p>
        </div>
        <button className="adm-btn adm-btn--primary" onClick={() => setModal('add')}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Driver
        </button>
      </div>

      {error && (
        <div className="adm-card" style={{ marginBottom: 16, color: 'var(--adm-danger,#e03d3d)', fontSize: 13, padding: '14px 18px' }}>
          {error}
        </div>
      )}

      {/* ── Overview stats cards ── */}
      <div className="adm-stats-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <StatCard
          label="Active Drivers"
          value={loading ? '…' : overview.activeCount}
          cardClass="adm-stat-card--amber"
          iconClass="adm-stat-icon--amber"
          footer={`${inactiveCount} inactive`}
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="7" r="4"/><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/></svg>}
        />
        <StatCard
          label="Today's Deliveries"
          value={loading ? '…' : overview.today}
          cardClass="adm-stat-card--blue"
          iconClass="adm-stat-icon--blue"
          footer="delivered orders"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>}
        />
        <StatCard
          label="This Week"
          value={loading ? '…' : overview.thisWeek}
          cardClass="adm-stat-card--green"
          iconClass="adm-stat-icon--green"
          footer="delivered orders"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
        />
        <StatCard
          label="This Month"
          value={loading ? '…' : overview.thisMonth}
          cardClass="adm-stat-card--purple"
          iconClass="adm-stat-icon--purple"
          footer="delivered orders"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
        />
        <StatCard
          label="Best This Month"
          value={loading ? '…' : (overview.bestDriver?.full_name?.split(' ')[0] ?? '—')}
          cardClass="adm-stat-card--orange"
          iconClass="adm-stat-icon--orange"
          footer={overview.bestCount > 0 ? `${overview.bestCount} deliveries` : 'no data yet'}
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}
        />
      </div>

      {/* ── Toolbar ── */}
      <div className="adm-toolbar" style={{ flexWrap: 'wrap', gap: 8 }}>
        <input
          className="adm-search"
          type="text"
          placeholder="Search by name or phone…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="adm-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="active">Active ({activeCount})</option>
          <option value="inactive">Inactive ({inactiveCount})</option>
          <option value="all">All drivers</option>
        </select>
        {/* Period filter tabs */}
        <div style={{ display: 'flex', gap: 2, background: 'var(--adm-surface-4)', borderRadius: 8, padding: 2 }}>
          {PERIODS.map(p => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPeriod(p.key)}
              style={{
                padding: '5px 10px', fontSize: 11.5, fontWeight: 800, borderRadius: 6,
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

      {/* ── Driver table ── */}
      <div className="adm-card">
        <div className="adm-section-head">
          <span className="adm-section-title">Driver Pool</span>
          <span className="adm-table-muted" style={{ fontSize: 12, fontWeight: 700 }}>{filtered.length} drivers</span>
        </div>

        {loading ? (
          <div className="adm-empty"><div className="adm-empty-sub">Loading…</div></div>
        ) : filtered.length === 0 ? (
          <div className="adm-empty">
            <div className="adm-empty-emoji">🛵</div>
            <div className="adm-empty-title">No drivers found</div>
            <div className="adm-empty-sub">{search ? 'Try a different search.' : 'Add your first driver to get started.'}</div>
          </div>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Driver</th>
                  <th>Vehicle</th>
                  <th>Phone</th>
                  <th style={{ textAlign: 'right' }}>
                    {PERIODS.find(p => p.key === period)?.label} Runs
                  </th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                  <th style={{ textAlign: 'right' }}>Revenue</th>
                  <th>Last Delivery</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(d => {
                  const s = statsMap[d.id] ?? {};
                  return (
                    <tr
                      key={d.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/admin/drivers/${d.id}`)}
                    >
                      <td>
                        <div style={{ fontWeight: 800 }}>{d.full_name}</div>
                        {d.notes && (
                          <div style={{ fontSize: 11, color: 'var(--adm-text-3)', marginTop: 1 }}>{d.notes}</div>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: 15 }}>{VEHICLE_ICON[d.vehicle_type] ?? '🛵'}</span>
                        {' '}
                        <span style={{ fontSize: 12, color: 'var(--adm-text-2)' }}>
                          {d.vehicle_type.charAt(0).toUpperCase() + d.vehicle_type.slice(1)}
                        </span>
                      </td>
                      <td className="adm-table-muted">{d.phone || '—'}</td>
                      <td style={{ textAlign: 'right', fontWeight: 900, fontSize: 15 }}>
                        {periodCount(d.id)}
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--adm-text-2)', fontSize: 13 }}>
                        {s.total ?? 0}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, fontSize: 13 }}>
                        {s.totalRevenue ? fmtCurrency(s.totalRevenue) : '—'}
                      </td>
                      <td className="adm-table-muted" style={{ fontSize: 12 }}>
                        {fmtTime(s.lastDelivery)}
                      </td>
                      <td>
                        {d.is_active
                          ? <span className="adm-badge adm-badge--green">Active</span>
                          : <span className="adm-badge adm-badge--gray">Inactive</span>
                        }
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end' }}>
                          <button
                            className="adm-btn adm-btn--ghost"
                            style={{ height: 32, padding: '0 10px', fontSize: 11.5 }}
                            onClick={() => setModal({ driver: d })}
                          >
                            Edit
                          </button>
                          <button
                            className="adm-btn adm-btn--ghost"
                            style={{ height: 32, padding: '0 10px', fontSize: 11.5 }}
                            onClick={() => handleToggle(d)}
                            disabled={toggling === d.id}
                          >
                            {toggling === d.id ? '…' : d.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            className="adm-btn adm-btn--primary"
                            style={{ height: 32, padding: '0 10px', fontSize: 11.5 }}
                            onClick={() => navigate(`/admin/drivers/${d.id}`)}
                          >
                            View →
                          </button>
                        </div>
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
