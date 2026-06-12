import { NavLink } from 'react-router-dom';

const navItems = [
    { to: '/admin/dashboard', label: 'Dashboard' },
    { to: '/admin/orders', label: 'Orders' },
    { to: '/admin/products', label: 'Products' },
    { to: '/admin/users', label: 'Users' },
    { to: '/admin/drivers', label: 'Drivers' },
    { to: '/admin/ingredients', label: 'Ingredients' },
    { to: '/admin/pos', label: 'POS' },
    { to: '/admin/settings', label: 'Settings' },
];

export default function NewSidebar() {
    return (
        <aside className="newadm-sidebar">
            <div className="newadm-sidebar-brand">
                <div className="newadm-sidebar-mark">B</div>
                <div>
                    <div className="newadm-sidebar-title">BURGERIZZA</div>
                    <div className="newadm-sidebar-subtitle">Management suite</div>
                </div>
            </div>

            <nav className="newadm-sidebar-nav" aria-label="Admin sections">
                {navItems.map(item => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            `newadm-nav-link${isActive ? ' newadm-nav-link-active' : ''}`
                        }
                    >
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            <div className="newadm-sidebar-footer">
                <div className="newadm-sidebar-footer-title">Fresh foundation</div>
                <p className="newadm-sidebar-footer-copy">
                    A clean build for a premium operator experience. No legacy styles, no live data yet.
                </p>
            </div>
        </aside>
    );
}
