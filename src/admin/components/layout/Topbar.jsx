import { useLocation } from 'react-router-dom';

const pageLabels = {
    dashboard:   'Executive dashboard',
    orders:      'Orders control',
    products:    'Menu catalog',
    users:       'Customer insights',
    drivers:     'Driver dispatch',
    ingredients: 'Kitchen inventory',
    pos:         'Point of sale',
    settings:    'Operational settings',
};

export default function Topbar({ onMenuToggle }) {
    const location = useLocation();
    const segment = location.pathname.split('/').pop() || 'dashboard';
    const pageTitle = pageLabels[segment] ?? 'Admin command center';

    return (
        <header className="admin-topbar">
            <button
                className="admin-topbar-menu-btn"
                onClick={onMenuToggle}
                aria-label="Toggle navigation"
                type="button"
            >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="2" y1="4.5" x2="16" y2="4.5" />
                    <line x1="2" y1="9"   x2="16" y2="9"   />
                    <line x1="2" y1="13.5" x2="16" y2="13.5" />
                </svg>
            </button>
            <div className="admin-topbar-text">
                <div className="admin-topbar-badge">BURGERIZZA</div>
                <div className="admin-topbar-title">{pageTitle}</div>
            </div>
            <div className="admin-topbar-actions">
                <div className="admin-topbar-chip">Quiet Launch</div>
                <div className="admin-topbar-avatar" aria-hidden="true">B</div>
            </div>
        </header>
    );
}
