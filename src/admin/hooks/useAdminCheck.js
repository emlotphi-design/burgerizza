import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

// Possible status values:
//   'loading'         — waiting for auth session or profile fetch
//   'unauthenticated' — no active Supabase session
//   'forbidden'       — session exists but role !== 'admin'
//   'authorized'      — session exists and role === 'admin'
export function useAdminCheck() {
  const { currentUser, isLoggedIn, loading: authLoading } = useAuth();
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    // Wait for AuthContext to finish restoring the session
    if (authLoading) {
      setStatus('loading');
      return;
    }

    if (!isLoggedIn || !currentUser?.id) {
      setStatus('unauthenticated');
      return;
    }

    let cancelled = false;
    setStatus('loading');

    // Read the current user's own profile row.
    // RLS policy "profiles: select own" (auth.uid() = id) allows this.
    // If Supabase is not configured the stub lacks .from(), so we catch that too.
    (async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', currentUser.id)
          .single();

        if (cancelled) return;

        if (error || !data) {
          // Profile row missing (pre-migration user) or query error → not admin
          console.warn('[AdminRoute] profile fetch failed:', error?.message ?? 'no data');
          setStatus('forbidden');
        } else {
          setStatus(data.role === 'admin' ? 'authorized' : 'forbidden');
        }
      } catch (err) {
        // supabase stub has no .from() → TypeError; treat as forbidden
        if (cancelled) return;
        console.warn('[AdminRoute] supabase.from threw (stub or network):', err?.message);
        setStatus('forbidden');
      }
    })();

    return () => { cancelled = true; };
  }, [authLoading, isLoggedIn, currentUser?.id]);

  return status;
}
