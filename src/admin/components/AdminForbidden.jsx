import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../styles/admin.css';

export default function AdminForbidden({ unauthenticated = false }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/auth', { replace: true });
  };

  return (
    <div className="adm-forbidden-page">
      <div className="adm-card adm-forbidden-card">

        <div className="adm-forbidden-icon">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
        </div>

        <div className="adm-forbidden-code">
          {unauthenticated ? '401' : '403'}
        </div>

        <div className="adm-forbidden-title">
          {unauthenticated ? 'Login Required' : 'Admin Access Required'}
        </div>

        <p className="adm-forbidden-desc">
          {unauthenticated
            ? 'You need to be logged in to access this page.'
            : "Your account doesn't have admin privileges. Contact the site owner to request access."
          }
        </p>

        <div className="adm-forbidden-actions">
          {unauthenticated ? (
            <Link to="/auth" className="adm-btn adm-btn--primary" style={{ textDecoration: 'none' }}>
              Go to Login
            </Link>
          ) : (
            <button className="adm-btn adm-btn--ghost" onClick={handleLogout}>
              Sign in with a different account
            </button>
          )}
          <Link to="/" className="adm-btn adm-btn--ghost" style={{ textDecoration: 'none' }}>
            ← Back to site
          </Link>
        </div>

      </div>
    </div>
  );
}
