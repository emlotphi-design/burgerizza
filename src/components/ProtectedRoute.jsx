import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isLoggedIn, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (!isLoggedIn) {
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
