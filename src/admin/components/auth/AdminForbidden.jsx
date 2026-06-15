export default function AdminForbidden({ unauthenticated = false }) {
    const title = unauthenticated ? 'Login Required' : 'Admin Access Required';
    const message = unauthenticated
        ? 'Sign in with the designated admin account to view this section.'
        : 'Your account does not have permission to access this page.';

    return (
        <main style={{
            minHeight: '100vh',
            display: 'grid',
            placeItems: 'center',
            padding: 32,
            background: '#0d0f14',
            color: 'rgba(255,255,255,0.88)',
            fontFamily: 'Inter, system-ui, sans-serif',
        }}>
            <div style={{
                maxWidth: 520,
                width: '100%',
                textAlign: 'center',
                background: 'rgba(20, 22, 30, 0.90)',
                borderRadius: 28,
                boxShadow: '0 28px 80px rgba(0,0,0,0.50)',
                padding: '32px 28px',
                border: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(24px)',
            }}>
                <div style={{
                    display: 'inline-flex',
                    padding: '8px 16px',
                    borderRadius: 999,
                    background: 'rgba(247,201,72,0.14)',
                    color: 'rgba(247,201,72,0.90)',
                    border: '1px solid rgba(247,201,72,0.22)',
                    fontWeight: 800,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    fontSize: 11,
                    marginBottom: 20,
                }}>
                    Access blocked
                </div>
                <h1 style={{
                    margin: '0 0 16px',
                    fontSize: 'clamp(1.8rem, 2.4vw, 2.4rem)',
                    lineHeight: 1.1,
                    color: 'rgba(255,255,255,0.94)',
                }}>
                    {title}
                </h1>
                <p style={{
                    margin: 0,
                    color: 'rgba(255,255,255,0.44)',
                    fontSize: 15,
                    lineHeight: 1.75,
                }}>
                    {message}
                </p>
                <a
                    href="/"
                    style={{
                        display: 'inline-flex',
                        marginTop: 28,
                        background: 'linear-gradient(135deg, rgba(247,201,72,0.92), rgba(245,180,59,0.92))',
                        color: '#1a1200',
                        textDecoration: 'none',
                        padding: '11px 22px',
                        borderRadius: 999,
                        fontWeight: 800,
                    }}
                >
                    Back to site
                </a>
            </div>
        </main>
    );
}
