import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Redirects to /auth if not logged in.
// TODO: add role-based check (e.g. currentUser.role === 'admin') once backend supports it.
export default function AdminRoute({ children }) {
  const { isLoggedIn, loading } = useAuth();
  if (loading) return null;
  if (!isLoggedIn) return <Navigate to="/auth" replace />;
  return children;
}
