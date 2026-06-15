import { useEffect, useState, useRef } from 'react';
import '../styles/orders.css';
import {
    fetchOrders,
    subscribeToOrders,
    updateOrderStatus,
    assignDriverAndAdvance,
    fetchActiveDrivers,
    getYesterdayStart,
} from '../services/adminService';

function formatAddress(a) {
    if (!a) return '';
    if (typeof a === 'string') return a;
    if (typeof a === 'object') {
        const parts = [];
        if (a.street) parts.push(a.street + (a.houseNumber ? ' ' + a.houseNumber : ''));
        if (a.city) parts.push(a.city);
        if (a.floor) parts.push('Floor ' + a.floor);
        if (a.doorbellName) parts.push(a.doorbellName);
        return parts.join(', ');
    }
    return String(a);
}

function getDisplayOrderNumber(id) {
    if (!id) return '000';
    if (typeof id === 'number') {
        return `#${String(id).slice(-3).padStart(3, '0')}`;
    }
    const normalized = String(id);
    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
        hash = (hash * 31 + normalized.charCodeAt(i)) & 0xffffffff;
    }
    const number = Math.abs(hash % 900) + 100;
    return `#${String(number).padStart(3, '0')}`;
}

function StatusPill({ status }) {
    return <span className={`admin-pill admin-pill--${status.replace(/_/g, '-')}`}>{status.replace(/_/g, ' ')}</span>;
}

function InlineItems({ items = [] }) {
    return (
        <div className="admin-items-inline">
            {items.map((it, idx) => (
                <div key={idx} className="admin-item">
                    <span className="admin-item-qty">{it.quantity}×</span>
                    <span className="admin-item-name">{it.name}</span>
                </div>
            ))}
        </div>
    );
}

export default function Orders() {
    const [orders, setOrders] = useState([]);
    const [expanded, setExpanded] = useState({});
    const [drivers, setDrivers] = useState([]);
    const channelRef = useRef(null);

    useEffect(() => {
        let mounted = true;
        fetchOrders({ since: getYesterdayStart(), limit: 200 })
            .then(data => { if (mounted) setOrders(data || []); })
            .catch(() => {});

        fetchActiveDrivers()
            .then(d => { if (mounted) setDrivers(d || []); })
            .catch(() => {});

        channelRef.current = subscribeToOrders(({ eventType, new: row, old }) => {
            setOrders(prev => {
                if (eventType === 'INSERT') return [row, ...prev];
                if (eventType === 'UPDATE') return prev.map(p => (p.id === row.id ? row : p));
                if (eventType === 'DELETE') return prev.filter(p => p.id !== old.id);
                return prev;
            });
        }, 'new-admin-orders');

        return () => { mounted = false; channelRef.current?.unsubscribe?.(); };
    }, []);

    function handleAdvance(o) {
        const NEXT = {
            pending: 'waiting_confirmation',
            waiting_confirmation: 'confirmed',
            confirmed: 'preparing',
            preparing: 'ready',
            ready: 'completed',
        };
        const next = NEXT[o.status] || 'completed';
        updateOrderStatus(o.id, next).catch(() => {});
    }

    function handleAssignDriver(o) {
        const name = drivers?.[0]?.full_name ?? prompt('Driver name');
        if (!name) return;
        assignDriverAndAdvance(o.id, name, 'confirmed').catch(() => {});
    }

    function toggleInfo(id) {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    }

    return (
        <section className="admin-orders-page">
            <div className="admin-orders-shell">
                <div className="admin-orders-content">
                    <div className="admin-page-header">
                        <div>
                            <h2>Kitchen Orders</h2>
                            <p className="admin-page-subtitle">Live order stream with status control and driver assignment.</p>
                        </div>
                        <div className="admin-page-actions">
                            <button
                                className="admin-btn admin-btn--primary"
                                onClick={() => fetchOrders({ since: getYesterdayStart(), limit: 200 }).then(d => setOrders(d))}
                            >
                                Refresh
                            </button>
                        </div>
                    </div>

                    <section className="admin-orders-panel">
                        <div className="admin-orders-table-header">
                            <span>Order</span>
                            <span>Customer</span>
                            <span>Items</span>
                            <span>Status</span>
                            <span>Info</span>
                        </div>

                        <div className="admin-orders-list">
                            {orders.map(o => (
                                <div key={o.id} className="admin-orders-row-group">
                                    <div className="admin-orders-row">
                                        <div className="admin-order-summary">
                                            <div className="admin-order-summary-inner">
                                                <div className="admin-order-number">{getDisplayOrderNumber(o.id)}</div>
                                                <div className="admin-order-price">${Number(o.total_price || 0).toFixed(2)}</div>
                                            </div>
                                            <div className="admin-order-meta">{new Date(o.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</div>
                                        </div>

                                        <div className="admin-order-customer-cell">
                                            <div className="admin-order-customer-name">{o.customer_name || o.customer_email || 'Guest'}</div>
                                        </div>

                                        <div className="admin-order-items-cell">
                                            <InlineItems items={o.items || []} />
                                        </div>

                                        <div className="admin-order-status-cell">
                                            <StatusPill status={o.status} />
                                        </div>

                                        <div className="admin-order-info-cell">
                                            <div className="admin-info-actions">
                                                <button className="admin-btn admin-btn--tiny" onClick={() => handleAssignDriver(o)}>A</button>
                                                <button className="admin-btn admin-btn--primary admin-btn--tiny" onClick={() => handleAdvance(o)}>▶</button>
                                                <button className="admin-info-toggle admin-info-toggle--small" onClick={() => toggleInfo(o.id)} aria-expanded={!!expanded[o.id]}>
                                                    <span className={`admin-info-chevron ${expanded[o.id] ? 'expanded' : ''}`}>▾</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {expanded[o.id] && (
                                        <div className="admin-order-info-row">
                                            <div className="admin-order-info-title">Info</div>
                                            <div className="admin-order-info-grid">
                                                <div>
                                                    <div className="admin-order-info-key">Customer</div>
                                                    <div className="admin-order-info-value">{o.customer_name || o.customer_email || 'Guest'}</div>
                                                </div>
                                                <div>
                                                    <div className="admin-order-info-key">Address</div>
                                                    <div className="admin-order-info-value">{formatAddress(o.delivery_address) || formatAddress(o.customer_address) || 'No address'}</div>
                                                </div>
                                                <div>
                                                    <div className="admin-order-info-key">Floor</div>
                                                    <div className="admin-order-info-value">{o.delivery_address?.floor || o.customer_address?.floor || 'N/A'}</div>
                                                </div>
                                                <div>
                                                    <div className="admin-order-info-key">Phone</div>
                                                    <div className="admin-order-info-value">{o.customer_phone || o.phone || '—'}</div>
                                                </div>
                                                <div className="admin-order-info-full">
                                                    <div className="admin-order-info-key">Notes</div>
                                                    <div className="admin-order-info-value">{o.notes || o.customer_notes || 'No notes'}</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </section>
    );
}
