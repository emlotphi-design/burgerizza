import { useState } from 'react';

const MOCK_ORDERS = [
  { id: '#1042', customer: 'Anna M.',     email: 'anna@example.com',   items: 'Custom Burger + Fries',    total: '€14.90', status: 'delivered', type: 'burger', date: '29 May 2026, 14:32' },
  { id: '#1041', customer: 'Lukas B.',    email: 'lukas@example.com',  items: 'Margherita Pizza ×2',      total: '€22.00', status: 'preparing', type: 'pizza',  date: '29 May 2026, 14:26' },
  { id: '#1040', customer: 'Sophie K.',   email: 'sophie@example.com', items: 'BBQ Burger + Cola',        total: '€12.50', status: 'pending',   type: 'burger', date: '29 May 2026, 14:20' },
  { id: '#1039', customer: 'Max W.',      email: 'max@example.com',    items: 'Custom Pizza',             total: '€9.80',  status: 'delivered', type: 'pizza',  date: '29 May 2026, 14:06' },
  { id: '#1038', customer: 'Julia R.',    email: 'julia@example.com',  items: 'Veggie Burger + Juice',    total: '€11.30', status: 'cancelled', type: 'burger', date: '29 May 2026, 13:53' },
  { id: '#1037', customer: 'Tom F.',      email: 'tom@example.com',    items: 'Pepperoni Pizza + Tiramisu', total: '€16.80', status: 'delivered', type: 'pizza', date: '29 May 2026, 13:40' },
  { id: '#1036', customer: 'Mia S.',      email: 'mia@example.com',    items: 'Double Beef Burger',       total: '€13.20', status: 'preparing', type: 'burger', date: '29 May 2026, 13:28' },
  { id: '#1035', customer: 'Erik D.',     email: 'erik@example.com',   items: 'Custom Pizza ×3',          total: '€27.00', status: 'delivered', type: 'pizza',  date: '29 May 2026, 13:15' },
];

const BADGE = {
  delivered: <span className="adm-badge adm-badge--green">Delivered</span>,
  preparing: <span className="adm-badge adm-badge--amber">Preparing</span>,
  pending:   <span className="adm-badge adm-badge--blue">Pending</span>,
  cancelled: <span className="adm-badge adm-badge--red">Cancelled</span>,
};

export default function Orders() {
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatus] = useState('all');

  const filtered = MOCK_ORDERS.filter(o => {
    const matchSearch = !search ||
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.toLowerCase().includes(search.toLowerCase()) ||
      o.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <>
      <div className="adm-page-header">
        <h1 className="adm-page-title">Orders</h1>
        <p className="adm-page-subtitle">View and manage all customer orders.</p>
      </div>

      <div className="adm-toolbar">
        <input
          className="adm-search"
          type="text"
          placeholder="Search by ID, name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="adm-select"
          value={statusFilter}
          onChange={e => setStatus(e.target.value)}
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="preparing">Preparing</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button className="adm-btn adm-btn--ghost">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Export
        </button>
      </div>

      <div className="adm-card">
        {filtered.length === 0 ? (
          <div className="adm-empty">
            <div className="adm-empty-emoji">📭</div>
            <div className="adm-empty-title">No orders found</div>
            <div className="adm-empty-sub">Try adjusting your search or filter.</div>
          </div>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(o => (
                  <tr key={o.id}>
                    <td style={{ fontWeight: 900 }}>{o.id}</td>
                    <td>
                      <div style={{ fontWeight: 800 }}>{o.customer}</div>
                      <div className="adm-table-muted">{o.email}</div>
                    </td>
                    <td className="adm-table-muted">{o.items}</td>
                    <td style={{ fontWeight: 900 }}>{o.total}</td>
                    <td>{BADGE[o.status]}</td>
                    <td className="adm-table-muted">{o.date}</td>
                    <td>
                      <button className="adm-btn adm-btn--ghost" style={{ height: 28, padding: '0 10px', fontSize: 11 }}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
