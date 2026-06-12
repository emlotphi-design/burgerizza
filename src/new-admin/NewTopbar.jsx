import { useLocation } from 'react-router-dom';

const pageLabels = {
    dashboard: 'Executive dashboard',
    orders: 'Orders control',
    products: 'Menu catalog',
    users: 'Customer insights',
    drivers: 'Driver dispatch',
    ingredients: 'Kitchen inventory',
    pos: 'Point of sale',
    settings: 'Operational settings',
};

export default function NewTopbar() {
    const location = useLocation();
    const segment = location.pathname.split('/').pop() || 'dashboard';
    const pageTitle = pageLabels[segment] ?? 'Admin command center';

    return (
        <header className="newadm-topbar">
            <div>
                <div className="newadm-topbar-badge">BURGERIZZA</div>
                <div className="newadm-topbar-title">{pageTitle}</div>
            </div>
            <div className="newadm-topbar-actions">
                <div className="newadm-topbar-chip">Quiet Launch</div>
                <div className="newadm-topbar-avatar" aria-hidden="true">B</div>
            </div>
        </header>
    );
}
