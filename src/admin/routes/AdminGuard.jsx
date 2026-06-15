import { useAdminCheck } from '../hooks/useAdminCheck';
import AdminForbidden from '../components/auth/AdminForbidden';

function AdminLoader() {
    return (
        <div style={{
            minHeight: '100vh',
            display: 'grid',
            placeItems: 'center',
            background: '#0d0f14',
            padding: '24px',
            color: 'rgba(255,255,255,0.88)',
            fontFamily: 'Inter, system-ui, sans-serif',
        }}>
            <div style={{
                maxWidth: 360,
                textAlign: 'center',
                borderRadius: 24,
                background: 'rgba(20,22,30,0.90)',
                padding: 32,
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 24px 80px rgba(0,0,0,0.50)',
            }}>
                <div style={{
                    width: 44,
                    height: 44,
                    margin: '0 auto 18px',
                    borderRadius: '50%',
                    border: '3px solid rgba(247,201,72,0.22)',
                    borderTopColor: 'rgba(247,201,72,0.80)',
                    animation: 'admin-spin 1s linear infinite',
                }} />
                <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 8, color: 'rgba(255,255,255,0.90)' }}>
                    Checking permissions…
                </div>
                <div style={{ color: 'rgba(255,255,255,0.36)', lineHeight: 1.7, fontSize: 14 }}>
                    Secure access for the BURGERIZZA management suite.
                </div>
            </div>
            <style>{`@keyframes admin-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

export default function AdminGuard({ children }) {
    const status = useAdminCheck();

    if (status === 'loading') return <AdminLoader />;
    if (status === 'unauthenticated') return <AdminForbidden unauthenticated />;
    if (status === 'forbidden') return <AdminForbidden />;
    return children;
}
