import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  // Hold render until auth state is resolved — never let an unresolved loading
  // state briefly render the protected page before the redirect fires.
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <span className="co-spinner" />
      </div>
    );
  }

  // Require a confirmed user — currentUser is only set after email_confirmed_at
  // is verified in AuthContext, so this check is equivalent to checking both
  // isLoggedIn AND email_confirmed_at at the same time.
  if (!currentUser) {
    return (
      <Navigate
        to="/auth"
        state={{ returnTo: location.pathname, tab: 'login' }}
        replace
      />
    );
  }

  return children;
}
