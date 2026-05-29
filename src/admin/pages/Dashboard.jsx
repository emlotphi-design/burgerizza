const STATS = [
  {
    label: 'Total Orders',
    value: '—',
    footer: 'No live data yet',
    iconClass: 'adm-stat-icon--amber',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 01-8 0"/>
      </svg>
    ),
  },
  {
    label: "Today's Revenue",
    value: '—',
    footer: 'No live data yet',
    iconClass: 'adm-stat-icon--green',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"/>
        <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
      </svg>
    ),
  },
  {
    label: 'Registered Users',
    value: '—',
    footer: 'No live data yet',
    iconClass: 'adm-stat-icon--blue',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
      </svg>
    ),
  },
  {
    label: 'Menu Categories',
    value: '4',
    footer: 'Pizza · Burger · Drinks · Desserts',
    iconClass: 'adm-stat-icon--orange',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
        <line x1="7" y1="7" x2="7.01" y2="7"/>
      </svg>
    ),
  },
];

const RECENT_ORDERS = [
  { id: '#1042', customer: 'Anna M.',    items: 'Custom Burger + Fries', total: '€14.90', status: 'delivered', time: '2 min ago' },
  { id: '#1041', customer: 'Lukas B.',   items: 'Margherita Pizza ×2',   total: '€22.00', status: 'preparing', time: '8 min ago' },
  { id: '#1040', customer: 'Sophie K.',  items: 'BBQ Burger + Cola',     total: '€12.50', status: 'pending',   time: '14 min ago' },
  { id: '#1039', customer: 'Max W.',     items: 'Custom Pizza',          total: '€9.80',  status: 'delivered', time: '28 min ago' },
  { id: '#1038', customer: 'Julia R.',   items: 'Veggie Burger + Juice', total: '€11.30', status: 'cancelled', time: '41 min ago' },
];

const ACTIVITY = [
  { dot: 'green',  title: 'Order #1042 delivered',         sub: 'Anna M. — €14.90',         time: '2m' },
  { dot: 'amber',  title: 'New order #1041 received',      sub: 'Lukas B. — 2 pizzas',       time: '8m' },
  { dot: 'blue',   title: 'New user registered',           sub: 'sophie.k@example.com',      time: '15m' },
  { dot: 'green',  title: 'Order #1039 delivered',         sub: 'Max W. — €9.80',            time: '28m' },
  { dot: 'gray',   title: 'Order #1038 cancelled',         sub: 'Julia R. — customer req.',  time: '41m' },
];

const STATUS_BADGE = {
  delivered: <span className="adm-badge adm-badge--green">Delivered</span>,
  preparing: <span className="adm-badge adm-badge--amber">Preparing</span>,
  pending:   <span className="adm-badge adm-badge--blue">Pending</span>,
  cancelled: <span className="adm-badge adm-badge--red">Cancelled</span>,
};

export default function Dashboard() {
  return (
    <>
      <div className="adm-page-header">
        <h1 className="adm-page-title">Dashboard</h1>
        <p className="adm-page-subtitle">Welcome back — here's what's happening at Burgerizza.</p>
      </div>

      {/* Stats */}
      <div className="adm-stats-grid">
        {STATS.map(s => (
          <div key={s.label} className="adm-card adm-stat-card">
            <div className="adm-stat-top">
              <div className={`adm-stat-icon ${s.iconClass}`}>{s.icon}</div>
            </div>
            <div className="adm-stat-value">{s.value}</div>
            <div className="adm-stat-label">{s.label}</div>
            <div className="adm-stat-footer">{s.footer}</div>
          </div>
        ))}
      </div>

      {/* Recent Orders + Activity */}
      <div className="adm-grid-2 adm-grid-2--wide">

        <div className="adm-card">
          <div className="adm-section-head">
            <span className="adm-section-title">Recent Orders</span>
            <button className="adm-section-action">View all →</button>
          </div>
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
                {RECENT_ORDERS.map(o => (
                  <tr key={o.id}>
                    <td style={{ fontWeight: 900 }}>{o.id}</td>
                    <td>{o.customer}</td>
                    <td className="adm-table-muted">{o.items}</td>
                    <td style={{ fontWeight: 900 }}>{o.total}</td>
                    <td>{STATUS_BADGE[o.status]}</td>
                    <td className="adm-table-muted">{o.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="adm-card">
          <div className="adm-section-head">
            <span className="adm-section-title">Activity Feed</span>
            <button className="adm-section-action">Clear</button>
          </div>
          <div className="adm-activity-list">
            {ACTIVITY.map((a, i) => (
              <div key={i} className="adm-activity-row">
                <div className={`adm-activity-dot adm-activity-dot--${a.dot}`} />
                <div className="adm-activity-body">
                  <div className="adm-activity-title">{a.title}</div>
                  <div className="adm-activity-sub">{a.sub}</div>
                </div>
                <div className="adm-activity-time">{a.time}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}
