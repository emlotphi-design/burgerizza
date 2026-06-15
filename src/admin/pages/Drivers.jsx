import { useEffect, useMemo, useState } from 'react';
import '../styles/products.css';
import '../styles/dashboard.css';
import '../styles/forms.css';
import '../styles/modal.css';
import {
    fetchAllDrivers,
    createDriver,
    updateDriver,
    toggleDriverActive,
    fetchAssignmentsWithOrders,
} from '../services/adminService';
import Modal from '../components/ui/Modal';
import Toggle from '../components/ui/Toggle';
import { fmtTime } from '../utils/format';

const VEHICLE_OPTIONS = [
    { value: 'scooter', label: 'Scooter', icon: '🛵' },
    { value: 'bicycle', label: 'Bicycle', icon: '🚲' },
    { value: 'car',     label: 'Car',     icon: '🚗' },
];
const VEHICLE_ICON = { scooter: '🛵', bicycle: '🚲', car: '🚗' };
const EMPTY_FORM = { full_name: '', phone: '', email: '', vehicle_type: 'scooter', notes: '', is_active: true };

function getDateBounds() {
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const weekStart  = new Date(now); weekStart.setDate(now.getDate() - now.getDay()); weekStart.setHours(0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return { todayStart, weekStart, monthStart };
}

function computeDriverStats(assignments) {
    const { todayStart, weekStart, monthStart } = getDateBounds();
    const delivered = assignments.filter(a => a.orders?.status === 'delivered' || a.orders?.status === 'completed');
    let today = 0, thisWeek = 0, thisMonth = 0;
    for (const a of delivered) {
        const at = new Date(a.assigned_at);
        if (at >= todayStart) today++;
        if (at >= weekStart)  thisWeek++;
        if (at >= monthStart) thisMonth++;
    }
    return {
        today, thisWeek, thisMonth, total: delivered.length,
        totalRevenue: delivered.reduce((s, a) => s + Number(a.orders?.total_price ?? 0), 0),
        lastDelivery: delivered.sort((a, b) => new Date(b.assigned_at) - new Date(a.assigned_at))[0]?.assigned_at ?? null,
    };
}

function DriverModal({ driver, onSave, onClose }) {
    const [form, setForm] = useState(driver ? {
        full_name: driver.full_name, phone: driver.phone || '', email: driver.email || '',
        vehicle_type: driver.vehicle_type || 'scooter', notes: driver.notes || '', is_active: driver.is_active,
    } : { ...EMPTY_FORM });
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState('');

    function set(field, value) { setForm(p => ({ ...p, [field]: value })); }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!form.full_name.trim()) { setErr('Name is required.'); return; }
        setSaving(true); setErr('');
        try {
            await onSave(driver?.id ?? null, {
                full_name: form.full_name.trim(), phone: form.phone.trim(),
                email: form.email.trim(), vehicle_type: form.vehicle_type,
                notes: form.notes.trim(), is_active: form.is_active,
            });
            onClose();
        } catch (e) { setErr(e.message); } finally { setSaving(false); }
    }

    return (
        <Modal title={driver ? 'Edit Driver' : 'Add Driver'} onClose={onClose}>
            <form className="admin-modal-body" onSubmit={handleSubmit}>
                <div className="admin-form-row">
                    <label className="admin-form-label">Full name *</label>
                    <input className="admin-form-input" value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="e.g. Ali Hassan" />
                </div>
                <div className="admin-form-2col">
                    <div className="admin-form-row">
                        <label className="admin-form-label">Phone</label>
                        <input className="admin-form-input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+49 123 456 789" />
                    </div>
                    <div className="admin-form-row">
                        <label className="admin-form-label">Email</label>
                        <input className="admin-form-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="driver@example.com" />
                    </div>
                </div>
                <div className="admin-form-row">
                    <label className="admin-form-label">Vehicle</label>
                    <select className="admin-form-input admin-products-select" value={form.vehicle_type} onChange={e => set('vehicle_type', e.target.value)}>
                        {VEHICLE_OPTIONS.map(v => <option key={v.value} value={v.value}>{v.icon} {v.label}</option>)}
                    </select>
                </div>
                <div className="admin-form-row">
                    <label className="admin-form-label">Notes</label>
                    <input className="admin-form-input" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional notes" />
                </div>
                <div className="admin-form-row admin-form-row--inline">
                    <label className="admin-form-label">Active</label>
                    <Toggle on={form.is_active} onChange={() => set('is_active', !form.is_active)} label="Active" />
                </div>
                {err && <div className="admin-form-err">{err}</div>}
                <div className="admin-modal-footer" style={{ padding: 0, border: 'none' }}>
                    <button type="button" className="admin-form-btn" onClick={onClose}>Cancel</button>
                    <button type="submit" className="admin-form-btn admin-form-btn--primary" disabled={saving}>
                        {saving ? 'Saving…' : driver ? 'Save Changes' : 'Add Driver'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

export default function Drivers() {
    const [drivers,     setDrivers]     = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [loading,     setLoading]     = useState(true);
    const [error,       setError]       = useState(null);
    const [search,      setSearch]      = useState('');
    const [statusFilter, setStatusFilter] = useState('active');
    const [period,      setPeriod]      = useState('month');
    const [modal,       setModal]       = useState(null);
    const [toggling,    setToggling]    = useState(null);

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
        } catch (e) { setError(e.message); }
        finally { setLoading(false); }
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
        } catch (e) { alert('Failed: ' + e.message); }
        finally { setToggling(null); }
    }

    const statsMap = useMemo(() => {
        const map = {};
        for (const d of drivers) {
            map[d.id] = computeDriverStats(assignments.filter(a => a.driver_id === d.id));
        }
        return map;
    }, [drivers, assignments]);

    const overview = useMemo(() => {
        const { todayStart, weekStart, monthStart } = getDateBounds();
        const delivered = assignments.filter(a => a.orders?.status === 'delivered' || a.orders?.status === 'completed');
        let today = 0, thisWeek = 0, thisMonth = 0;
        for (const a of delivered) {
            const at = new Date(a.assigned_at);
            if (at >= todayStart) today++;
            if (at >= weekStart)  thisWeek++;
            if (at >= monthStart) thisMonth++;
        }
        const monthCounts = {};
        for (const a of delivered) {
            if (new Date(a.assigned_at) >= monthStart) {
                monthCounts[a.driver_id] = (monthCounts[a.driver_id] ?? 0) + 1;
            }
        }
        const bestId = Object.entries(monthCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
        const bestDriver = bestId ? drivers.find(d => d.id === bestId) : null;
        return {
            activeCount: drivers.filter(d => d.is_active).length,
            today, thisWeek, thisMonth,
            bestDriver, bestCount: bestId ? monthCounts[bestId] : 0,
        };
    }, [assignments, drivers]);

    const filtered = useMemo(() => drivers.filter(d => {
        const q = search.toLowerCase();
        const matchSearch = !q || d.full_name.toLowerCase().includes(q) || (d.phone || '').includes(q) || (d.email || '').toLowerCase().includes(q);
        const matchStatus = statusFilter === 'all' || (statusFilter === 'active' && d.is_active) || (statusFilter === 'inactive' && !d.is_active);
        return matchSearch && matchStatus;
    }), [drivers, search, statusFilter]);

    function periodCount(driverId) {
        const s = statsMap[driverId];
        if (!s) return 0;
        if (period === 'today') return s.today;
        if (period === 'week')  return s.thisWeek;
        if (period === 'month') return s.thisMonth;
        return s.total;
    }

    const PERIODS = [
        { key: 'today', label: 'Today' },
        { key: 'week',  label: 'Week' },
        { key: 'month', label: 'Month' },
        { key: 'all',   label: 'All' },
    ];

    return (
        <div className="admin-products-page">
            {modal === 'add'  && <DriverModal onSave={handleSave} onClose={() => setModal(null)} />}
            {modal?.driver    && <DriverModal driver={modal.driver} onSave={handleSave} onClose={() => setModal(null)} />}

            <div className="admin-page-header">
                <div>
                    <h2>Drivers</h2>
                    <p className="admin-page-subtitle">Delivery pool management &amp; performance</p>
                </div>
                <div className="admin-page-actions">
                    <button className="admin-btn admin-btn--primary" onClick={() => setModal('add')}>
                        + Add Driver
                    </button>
                </div>
            </div>

            {error && <div className="admin-products-error">{error}</div>}

            <div className="admin-dash-stats">
                {[
                    { label: 'Active Drivers',   value: loading ? '…' : overview.activeCount,  icon: '🚗', iconCls: 'admin-dash-stat-icon--green'  },
                    { label: 'Deliveries Today', value: loading ? '…' : overview.today,        icon: '📦', iconCls: 'admin-dash-stat-icon--amber'  },
                    { label: 'This Week',         value: loading ? '…' : overview.thisWeek,     icon: '📅', iconCls: 'admin-dash-stat-icon--blue'   },
                    { label: 'This Month',        value: loading ? '…' : overview.thisMonth,    icon: '🗓️', iconCls: 'admin-dash-stat-icon--purple' },
                ].map(s => (
                    <div key={s.label} className="admin-dash-stat">
                        <div className="admin-dash-stat-top">
                            <div className={`admin-dash-stat-icon ${s.iconCls}`} style={{ fontSize: '1rem', width: 36, height: 36, borderRadius: 11, display: 'grid', placeItems: 'center' }}>
                                {s.icon}
                            </div>
                        </div>
                        <div className="admin-dash-stat-value">{s.value}</div>
                        <div className="admin-dash-stat-label">{s.label}</div>
                    </div>
                ))}
            </div>

            {overview.bestDriver && (
                <div className="admin-products-panel" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span style={{ fontSize: '1.5rem' }}>🏆</span>
                    <div>
                        <div style={{ fontSize: '0.80rem', fontWeight: 700, color: 'rgba(247,201,72,0.80)', marginBottom: 2 }}>Top Driver This Month</div>
                        <div style={{ fontSize: '1rem', fontWeight: 900, color: 'rgba(255,255,255,0.92)' }}>{overview.bestDriver.full_name}</div>
                        <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.40)' }}>{overview.bestCount} deliveries completed</div>
                    </div>
                </div>
            )}

            <div className="admin-products-toolbar">
                <input
                    className="admin-products-search"
                    placeholder="Search drivers…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <select className="admin-products-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="all">All drivers</option>
                    <option value="active">Active only</option>
                    <option value="inactive">Inactive</option>
                </select>
                <div className="admin-period-tabs">
                    {PERIODS.map(p => (
                        <button
                            key={p.key}
                            className={`admin-period-btn${period === p.key ? ' admin-period-btn--active' : ''}`}
                            onClick={() => setPeriod(p.key)}
                            type="button"
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="admin-products-panel">
                <div className="admin-products-panel-head">
                    <span className="admin-products-panel-title">Drivers</span>
                    <span className="admin-products-count">{filtered.length} drivers</span>
                </div>

                {loading ? (
                    <div className="admin-products-empty"><span className="admin-products-empty-sub">Loading drivers…</span></div>
                ) : filtered.length === 0 ? (
                    <div className="admin-products-empty">
                        <span className="admin-products-empty-emoji">🚗</span>
                        <span className="admin-products-empty-title">No drivers found</span>
                        <span className="admin-products-empty-sub">Add your first driver or adjust the filters.</span>
                    </div>
                ) : (
                    <div className="admin-driver-list">
                        {filtered.map(d => {
                            const s = statsMap[d.id];
                            const count = periodCount(d.id);
                            return (
                                <div
                                    key={d.id}
                                    className={`admin-driver-row${d.is_active ? '' : ' admin-driver-row--inactive'}`}
                                >
                                    <div className="admin-driver-info">
                                        <div className="admin-driver-avatar">
                                            {VEHICLE_ICON[d.vehicle_type] ?? '🚗'}
                                        </div>
                                        <div className="admin-driver-details">
                                            <div className="admin-driver-name">{d.full_name}</div>
                                            <div className="admin-driver-meta">
                                                {d.phone || d.email || 'No contact'}
                                                {s?.lastDelivery && <span className="admin-driver-last">Last: {fmtTime(s.lastDelivery)}</span>}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="admin-driver-stats-cell">
                                        <div className="admin-driver-count">{count}</div>
                                        <div className="admin-driver-count-label">deliveries</div>
                                    </div>

                                    <div style={{ display: 'flex', gap: 6 }}>
                                        {d.is_active
                                            ? <span className="admin-product-badge-active">Active</span>
                                            : <span className="admin-product-badge-hidden">Off</span>
                                        }
                                        <button className="admin-product-btn admin-product-btn--icon" onClick={() => setModal({ driver: d })} title="Edit">
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                            </svg>
                                        </button>
                                        <button
                                            className="admin-product-btn admin-product-btn--icon"
                                            onClick={() => handleToggle(d)}
                                            disabled={toggling === d.id}
                                            title={d.is_active ? 'Deactivate' : 'Activate'}
                                        >
                                            {d.is_active ? (
                                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                                                    <line x1="1" y1="1" x2="23" y2="23"/>
                                                </svg>
                                            ) : (
                                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                                    <circle cx="12" cy="12" r="3"/>
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
