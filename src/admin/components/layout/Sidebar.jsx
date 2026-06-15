import { NavLink } from 'react-router-dom';

const navItems = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: '🏠' },
    { to: '/admin/orders',    label: 'Orders',    icon: '🧾' },
    { to: '/admin/kitchen',   label: 'Kitchen',   icon: '👩‍🍳' },
    { to: '/admin/products',  label: 'Products',  icon: '🍔' },
    { to: '/admin/drivers',   label: 'Drivers',   icon: '🚗' },
    { to: '/admin/ingredients', label: 'Ingredients', icon: '🥬' },
    { to: '/admin/pos',       label: 'POS',       icon: '💳' },
    { to: '/admin/settings',  label: 'Settings',  icon: '⚙️' },
];

export default function Sidebar({ open, onClose }) {
    return (
        <aside
            className={`admin-sidebar${open ? ' admin-sidebar--open' : ''}`}
            aria-label="Primary navigation"
        >
            <div className="admin-sidebar-top">
                <div className="admin-sidebar-mark">B</div>
                <div className="admin-sidebar-title-wrap">
                    <div className="admin-sidebar-title">BURGERIZZA</div>
                    <div className="admin-sidebar-subtitle">Admin</div>
                </div>
                <button
                    className="admin-sidebar-close"
                    onClick={onClose}
                    aria-label="Close navigation"
                    type="button"
                >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                        <line x1="1" y1="1" x2="13" y2="13" />
                        <line x1="13" y1="1" x2="1" y2="13" />
                    </svg>
                </button>
            </div>

            <nav className="admin-sidebar-nav" aria-label="Admin sections">
                {navItems.map(item => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            `admin-nav-link${isActive ? ' admin-nav-link-active' : ''}`
                        }
                        onClick={onClose}
                    >
                        <span className="admin-nav-icon" aria-hidden>{item.icon}</span>
                        <span className="admin-nav-label">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="admin-sidebar-footer">
                <div className="admin-sidebar-footer-title">Status</div>
                <p className="admin-sidebar-footer-copy">Live dashboard connected.</p>
            </div>
        </aside>
    );
}
