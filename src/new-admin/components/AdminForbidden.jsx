export default function AdminForbidden({ unauthenticated = false }) {
    const title = unauthenticated ? 'Login Required' : 'Admin Access Required';
    const message = unauthenticated
        ? 'Sign in with the designated admin account to view this section.'
        : "Your account does not have permission to access this page.";

    return (
        <main style={{
            minHeight: '100vh',
            display: 'grid',
            placeItems: 'center',
            padding: 32,
            background: '#f7f2e9',
            color: '#111827',
            fontFamily: 'Inter, system-ui, sans-serif',
        }}>
            <div style={{
                maxWidth: 520,
                width: '100%',
                textAlign: 'center',
                background: '#ffffff',
                borderRadius: 28,
                boxShadow: '0 28px 80px rgba(15, 23, 42, 0.12)',
                padding: '32px 28px',
                border: '1px solid rgba(203, 213, 225, 0.6)',
            }}>
                <div style={{
                    display: 'inline-flex',
                    padding: '10px 16px',
                    borderRadius: 999,
                    background: 'rgba(251, 191, 36, 0.16)',
                    color: '#92400e',
                    fontWeight: 800,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    fontSize: 12,
                    marginBottom: 18,
                }}>
                    Access blocked
                </div>
                <h1 style={{
                    margin: '0 0 16px',
                    fontSize: 'clamp(2rem, 2.4vw, 2.8rem)',
                    lineHeight: 1.04,
                }}>
                    {title}
                </h1>
                <p style={{
                    margin: 0,
                    color: '#475569',
                    fontSize: 16,
                    lineHeight: 1.85,
                }}>
                    {message}
                </p>
                <a
                    href="/"
                    style={{
                        display: 'inline-flex',
                        marginTop: 28,
                        background: '#111827',
                        color: '#ffffff',
                        textDecoration: 'none',
                        padding: '12px 20px',
                        borderRadius: 999,
                        fontWeight: 700,
                    }}
                >
                    Back to site
                </a>
            </div>
        </main>
    );
}
