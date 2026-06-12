import { useAdminCheck } from './hooks/useAdminCheck';
import AdminForbidden from '../new-admin/components/AdminForbidden';

function AdminLoader() {
    return (
        <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#fff' }}>
            <div style={{ fontWeight: 700 }}>Checking admin permissions…</div>
        </div>
    );
}

export default function AdminRoute({ children }) {
    const status = useAdminCheck();

    if (status === 'loading') return <AdminLoader />;
    if (status === 'unauthenticated') return <AdminForbidden unauthenticated />;
    if (status === 'forbidden') return <AdminForbidden />;
    return children;
}
