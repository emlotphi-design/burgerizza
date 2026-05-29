import { useAuth } from '../../context/AuthContext';

// Admin email is set once in .env.local as VITE_ADMIN_EMAIL.
// No Supabase role promotion needed — email is checked directly
// against the authenticated session on both frontend and DB (via is_admin()).
const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL ?? '').trim().toLowerCase();

// Possible status values:
//   'loading'         — auth session still being restored
//   'unauthenticated' — no active Supabase session
//   'forbidden'       — logged in but email doesn't match VITE_ADMIN_EMAIL
//   'authorized'      — email matches, full admin access granted
export function useAdminCheck() {
  const { currentUser, isLoggedIn, loading: authLoading } = useAuth();

  if (authLoading) return 'loading';
  if (!isLoggedIn || !currentUser?.id) return 'unauthenticated';
  if (!ADMIN_EMAIL || currentUser.email?.trim().toLowerCase() !== ADMIN_EMAIL) return 'forbidden';
  return 'authorized';
}
