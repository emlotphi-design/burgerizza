import { useAdminCheck } from '../admin/hooks/useAdminCheck';
import AdminForbidden from './components/AdminForbidden';

function NewAdminLoader() {
    return (
        <div style={{
            minHeight: '100vh',
            display: 'grid',
            placeItems: 'center',
            background: '#f7f2e9',
            padding: '24px',
            color: '#1f2937',
            fontFamily: 'Inter, system-ui, sans-serif',
        }}>
            <div style={{
                maxWidth: 360,
                textAlign: 'center',
                borderRadius: 24,
                background: 'rgba(255,255,255,0.95)',
                padding: 32,
                boxShadow: '0 24px 80px rgba(15,23,42,0.08)',
            }}>
                <div style={{
                    width: 48,
                    height: 48,
                    margin: '0 auto 18px',
                    borderRadius: '50%',
                    border: '4px solid rgba(251,191,36,0.4)',
                    borderTopColor: '#fbbf24',
                    animation: 'newadm-spin 1s linear infinite',
                }} />
                <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 10 }}>Checking permissions…</div>
                <div style={{ color: '#4b5563', lineHeight: 1.8 }}>Secure access for the BURGERIZZA management suite.</div>
            </div>
            <style>{`@keyframes newadm-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

export default function NewAdminRoute({ children }) {
    const status = useAdminCheck();

    if (status === 'loading') return <NewAdminLoader />;
    if (status === 'unauthenticated') return <AdminForbidden unauthenticated />;
    if (status === 'forbidden') return <AdminForbidden />;
    return children;
}
