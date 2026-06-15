import { useEffect, useRef, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import '../styles/dashboard.css';
import {
    fetchDashboardStats,
    fetchTodayStats,
    fetchRevenueByDay,
    fetchStatusBreakdown,
    fetchTopItems,
    subscribeToOrders,
} from '../services/adminService';
import { useOrdering } from '../../store/OrderingContext';
import { fmtCurrency, fmtDate, fmtDay, itemsSummary } from '../utils/format';

const STATUS_CONFIG = {
    pending:              { label: 'Pending',    color: '#D4A017' },
    waiting_confirmation: { label: 'Waiting',    color: '#e8a217' },
    confirmed:            { label: 'Confirmed',  color: '#60a5fa' },
    preparing:            { label: 'Preparing',  color: '#f97316' },
    ready:                { label: 'Ready',      color: '#60a5fa' },
    delivered:            { label: 'Delivered',  color: '#34c759' },
    completed:            { label: 'Completed',  color: '#34c759' },
    cancelled:            { label: 'Cancelled',  color: '#ef4444' },
};

function StatusBadge({ status }) {
    const cls = status?.replace(/_/g, '-') ?? 'gray';
    return (
        <span className={`admin-dash-badge admin-dash-badge--${cls}`}>
            {STATUS_CONFIG[status]?.label ?? status}
        </span>
    );
}

function RevenueChart({ data }) {
    if (!data || data.length === 0) {
        return (
            <div className="admin-dash-empty" style={{ height: 110 }}>
                <span className="admin-dash-empty-sub">No revenue data</span>
            </div>
        );
    }
    const max = Math.max(...data.map(d => d.revenue), 0.01);
    const W = 560, H = 110;
    const barCount = data.length;
    const gap = 8;
    const barW = Math.floor((W - (barCount - 1) * gap) / barCount);

    return (
        <>
            <svg
                viewBox={`0 0 ${W} ${H}`}
                preserveAspectRatio="none"
                style={{ width: '100%', height: 110, display: 'block' }}
            >
                <defs>
                    <linearGradient id="bar-today" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#F7C948" stopOpacity="0.90" />
                        <stop offset="100%" stopColor="#F7C948" stopOpacity="0.36" />
                    </linearGradient>
                    <linearGradient id="bar-other" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#60a5fa" stopOpacity="0.70" />
                        <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.20" />
                    </linearGradient>
                </defs>
                {data.map((d, i) => {
                    const barH = Math.max((d.revenue / max) * (H - 20), d.orders > 0 ? 4 : 2);
                    const x = i * (barW + gap);
                    const y = H - barH;
                    const isToday = i === data.length - 1;
                    return (
                        <g key={d.date}>
                            <rect
                                x={x} y={y} width={barW} height={barH}
                                rx={5}
                                fill={isToday ? 'url(#bar-today)' : 'url(#bar-other)'}
                            />
                            {d.revenue > 0 && (
                                <text
                                    x={x + barW / 2} y={y - 5}
                                    textAnchor="middle"
                                    fontSize="9"
                                    fill={isToday ? 'rgba(247,201,72,0.92)' : 'rgba(147,197,253,0.70)'}
                                    fontWeight="700"
                                    fontFamily="Inter,sans-serif"
                                >
                                    €{d.revenue >= 1000 ? (d.revenue / 1000).toFixed(1) + 'k' : d.revenue.toFixed(0)}
                                </text>
                            )}
                        </g>
                    );
                })}
            </svg>
            <div className="admin-dash-bar-labels">
                {data.map((d, i) => (
                    <span
                        key={d.date}
                        className={`admin-dash-bar-label${i === data.length - 1 ? ' admin-dash-bar-label--today' : ''}`}
                    >
                        {fmtDay(d.date)}
                    </span>
                ))}
            </div>
        </>
    );
}

const STATUS_META = {
    online: { label: 'Online', desc: 'Accepting orders normally',                     cls: 'online' },
    busy:   { label: 'Busy',   desc: 'Open — delay warning shown to customers',       cls: 'busy'   },
    closed: { label: 'Closed', desc: 'Ordering disabled — customers cannot checkout', cls: 'closed' },
};

function RestaurantStatusSelector({ status, onChange, saving }) {
    const meta = STATUS_META[status] ?? STATUS_META.online;
    return (
        <div className="admin-dash-status-selector">
            <div className="admin-dash-status-info">
                <span className={`admin-dash-status-dot admin-dash-status-dot--${meta.cls}`} />
                <div>
                    <div className="admin-dash-status-label">Restaurant Status</div>
                    <div className="admin-dash-status-desc">{meta.desc}</div>
                </div>
            </div>
            <div className="admin-dash-seg" role="group" aria-label="Restaurant status">
                {Object.entries(STATUS_META).map(([val, m]) => (
                    <button
                        key={val}
                        className={`admin-dash-seg-btn admin-dash-seg-btn--${m.cls}${status === val ? ' admin-dash-seg-btn--active' : ''}`}
                        onClick={() => onChange(val)}
                        disabled={saving || status === val}
                        aria-pressed={status === val}
                    >
                        <span className="admin-dash-seg-dot" />
                        {m.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

export default function Dashboard() {
    const [allStats,    setAllStats]    = useState(null);
    const [todayStats,  setTodayStats]  = useState(null);
    const [chartData,   setChartData]   = useState([]);
    const [statusBreak, setStatusBreak] = useState({});
    const [topItems,    setTopItems]    = useState([]);
    const [loading,     setLoading]     = useState(true);
    const [error,       setError]       = useState(null);
    const [savingStatus, setSavingStatus] = useState(false);
    const channelRef = useRef(null);

    const { restaurantStatus, setRestaurantStatus } = useOrdering();

    async function handleStatusChange(val) {
        setSavingStatus(true);
        await setRestaurantStatus(val);
        setSavingStatus(false);
    }

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
        }, 'new-admin-dashboard');
        return () => { channelRef.current?.unsubscribe?.(); };
    }, []);

    const statusMax = useMemo(
        () => Math.max(...Object.values(statusBreak), 1),
        [statusBreak]
    );

    const statCards = [
        {
            label:   'Revenue Today',
            value:   loading ? '…' : fmtCurrency(todayStats?.todayRevenue ?? 0),
            footer:  'Completed orders',
            iconCls: 'admin-dash-stat-icon--amber',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23"/>
                    <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                </svg>
            ),
        },
        {
            label:   'Total Orders',
            value:   loading ? '…' : (allStats?.totalOrders ?? 0),
            footer:  'All time',
            iconCls: 'admin-dash-stat-icon--blue',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                    <line x1="3" y1="6" x2="21" y2="6"/>
                    <path d="M16 10a4 4 0 01-8 0"/>
                </svg>
            ),
        },
        {
            label:   'Active Orders',
            value:   loading ? '…' : (todayStats?.activeOrders ?? 0),
            footer:  'In progress now',
            iconCls: (todayStats?.activeOrders ?? 0) > 0 ? 'admin-dash-stat-icon--orange' : 'admin-dash-stat-icon--green',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="5.5" cy="17.5" r="2.5"/>
                    <circle cx="17.5" cy="17.5" r="2.5"/>
                    <path d="M8 17.5H15M15 17.5V9l-4-5H5L3 9v8.5"/>
                    <path d="M15 9h4l2 4v4.5h-3"/>
                </svg>
            ),
        },
        {
            label:   'Avg Order Value',
            value:   loading ? '…' : fmtCurrency(todayStats?.avgOrderValue ?? 0),
            footer:  'Per transaction',
            iconCls: 'admin-dash-stat-icon--purple',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
            ),
        },
    ];

    const recentOrders = allStats?.recentOrders ?? [];
    const curStatus = restaurantStatus ?? 'online';

    return (
        <div className="admin-dash-page">
            <div className="admin-dash-header">
                <div className="admin-dash-header-left">
                    <span className="admin-dash-brand-icon">🍔</span>
                    <div>
                        <h1 className="admin-dash-title">Dashboard</h1>
                        <div className="admin-dash-subtitle">
                            BURGERIZZA Operations
                            <span className="admin-dash-live-chip">
                                <span className="admin-dash-live-dot" />
                                LIVE
                            </span>
                        </div>
                    </div>
                </div>
                <span className={`admin-dash-status-mini admin-dash-status-mini--${curStatus}`}>
                    <span className="admin-dash-status-mini-dot" />
                    {curStatus === 'busy' ? 'Busy' : curStatus === 'closed' ? 'Closed' : 'Online'}
                </span>
            </div>

            <RestaurantStatusSelector
                status={curStatus}
                onChange={handleStatusChange}
                saving={savingStatus}
            />

            {error && <div className="admin-dash-error">Failed to load: {error}</div>}

            <div className="admin-dash-stats">
                {statCards.map(s => (
                    <div key={s.label} className="admin-dash-stat">
                        <div className="admin-dash-stat-top">
                            <div className={`admin-dash-stat-icon ${s.iconCls}`}>{s.icon}</div>
                        </div>
                        <div className="admin-dash-stat-value">{s.value}</div>
                        <div className="admin-dash-stat-label">{s.label}</div>
                        <div className="admin-dash-stat-footer">{s.footer}</div>
                    </div>
                ))}
            </div>

            <div className="admin-dash-grid-2">
                <div className="admin-dash-card">
                    <div className="admin-dash-card-title">Revenue — Last 7 Days</div>
                    <div className="admin-dash-card-sub">Excluding cancelled · Today highlighted</div>
                    {loading
                        ? <div className="admin-dash-empty" style={{ height: 130 }}><span className="admin-dash-empty-sub">Loading…</span></div>
                        : <RevenueChart data={chartData} />
                    }
                </div>

                <div className="admin-dash-card">
                    <div className="admin-dash-card-head">
                        <span className="admin-dash-card-title">Orders by Status</span>
                        <Link to="/admin/orders" className="admin-dash-card-action">View all →</Link>
                    </div>
                    {loading
                        ? <div className="admin-dash-empty"><span className="admin-dash-empty-sub">Loading…</span></div>
                        : (
                            <div className="admin-dash-status-list">
                                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                                    const count = statusBreak[key] ?? 0;
                                    if (count === 0 && !['pending', 'preparing'].includes(key)) return null;
                                    return (
                                        <div key={key} className="admin-dash-status-row">
                                            <span className="admin-dash-status-row-dot" style={{ background: cfg.color }} />
                                            <span className="admin-dash-status-row-label">{cfg.label}</span>
                                            <div className="admin-dash-status-bar-wrap">
                                                <div
                                                    className="admin-dash-status-bar"
                                                    style={{ width: `${(count / statusMax) * 100}%`, background: cfg.color }}
                                                />
                                            </div>
                                            <span className="admin-dash-status-row-count">{count}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )
                    }
                </div>
            </div>

            <div className="admin-dash-grid-2">
                <div className="admin-dash-card">
                    <div className="admin-dash-card-head">
                        <span className="admin-dash-card-title">Recent Orders</span>
                        <Link to="/admin/orders" className="admin-dash-card-action">View all →</Link>
                    </div>

                    {loading ? (
                        <div className="admin-dash-empty"><span className="admin-dash-empty-sub">Loading…</span></div>
                    ) : recentOrders.length === 0 ? (
                        <div className="admin-dash-empty">
                            <span className="admin-dash-empty-emoji">📭</span>
                            <span className="admin-dash-empty-title">No orders yet</span>
                        </div>
                    ) : (
                        <div className="admin-dash-table-wrap">
                            <table className="admin-dash-table">
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
                                            <td className="admin-dash-td-id">
                                                #{String(o.id).slice(0, 8).toUpperCase()}
                                            </td>
                                            <td>
                                                <div className="admin-dash-td-name">{o.customer_name || '—'}</div>
                                                <div className="admin-dash-td-muted">{o.customer_email || ''}</div>
                                            </td>
                                            <td className="admin-dash-td-muted">{itemsSummary(o.items)}</td>
                                            <td className="admin-dash-td-total">{fmtCurrency(o.total_price)}</td>
                                            <td><StatusBadge status={o.status} /></td>
                                            <td className="admin-dash-td-muted">{fmtDate(o.created_at)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="admin-dash-card">
                    <div className="admin-dash-card-head">
                        <span className="admin-dash-card-title">Top Items</span>
                        <span className="admin-dash-td-muted" style={{ fontSize: '0.76rem' }}>All time</span>
                    </div>

                    {loading ? (
                        <div className="admin-dash-empty"><span className="admin-dash-empty-sub">Loading…</span></div>
                    ) : topItems.length === 0 ? (
                        <div className="admin-dash-empty">
                            <span className="admin-dash-empty-emoji">🍕</span>
                            <span className="admin-dash-empty-title">No data yet</span>
                        </div>
                    ) : (
                        <div>
                            {topItems.map((item, i) => (
                                <div key={item.name} className="admin-dash-top-item">
                                    <span className="admin-dash-top-rank">{i + 1}</span>
                                    <span className="admin-dash-top-emoji">
                                        {item.name.toLowerCase().includes('burger') ? '🍔' : '🍕'}
                                    </span>
                                    <span className="admin-dash-top-name">{item.name}</span>
                                    <span className="admin-dash-top-count">×{item.count}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
