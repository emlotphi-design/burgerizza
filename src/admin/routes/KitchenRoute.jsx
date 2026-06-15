import { useAdminCheck } from '../hooks/useAdminCheck';
import AdminForbidden from '../components/auth/AdminForbidden';

function KitchenLoader() {
    return (
        <div style={{
            minHeight: '100vh',
            display: 'grid',
            placeItems: 'center',
            background: '#0d0f14',
            color: 'rgba(255,255,255,0.88)',
            fontFamily: 'Inter, system-ui, sans-serif',
        }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Checking admin permissions…</div>
        </div>
    );
}

export default function KitchenRoute({ children }) {
    const status = useAdminCheck();

    if (status === 'loading') return <KitchenLoader />;
    if (status === 'unauthenticated') return <AdminForbidden unauthenticated />;
    if (status === 'forbidden') return <AdminForbidden />;
    return children;
}
