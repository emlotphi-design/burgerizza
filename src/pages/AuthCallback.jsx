import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const url         = new URL(window.location.href);
    const code        = url.searchParams.get('code');
    const errorDesc   = url.searchParams.get('error_description');
    const hashParams  = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = hashParams.get('access_token');

    if (errorDesc) {
      setErrorMsg(decodeURIComponent(errorDesc.replace(/\+/g, ' ')));
      return;
    }

    let done = false;

    // Safety net: if nothing resolves in 6 s, fall back to /auth
    const timeout = setTimeout(() => {
      if (!done) {
        done = true;
        console.warn('[auth/callback] timeout — redirecting to /auth');
        navigate('/auth', { replace: true });
      }
    }, 6000);

    // onAuthStateChange fires as soon as detectSessionInUrl processes any
    // implicit-flow hash or PKCE code exchange, covering both flows.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (done) return;
      done = true;
      clearTimeout(timeout);
      console.log('[auth/callback] onAuthStateChange → session:', !!session);
      navigate(session ? '/profile' : '/auth', { replace: true });
    });

    async function handle() {
      try {
        // Implicit flow: hash already present, detectSessionInUrl will handle it.
        // We just need to wait for onAuthStateChange above. But also do a
        // getSession() call to cover the case where the hash was already consumed.
        if (!accessToken && !code) {
          // No token, no code — just check existing session
          const { data: { session } } = await supabase.auth.getSession();
          if (!done) {
            done = true;
            clearTimeout(timeout);
            navigate(session ? '/profile' : '/auth', { replace: true });
          }
          return;
        }

        // PKCE fallback: exchange code if present (may fail on cross-browser mobile)
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.warn('[auth/callback] PKCE exchange failed:', error.message);
            if (!done) {
              done = true;
              clearTimeout(timeout);
              setErrorMsg(
                'Der Link ist abgelaufen oder wurde in einem anderen Browser geöffnet. ' +
                'Bitte melde dich erneut an.'
              );
            }
            return;
          }
        }

        // For implicit flow or after successful exchange, getSession returns the session
        const { data: { session } } = await supabase.auth.getSession();
        if (!done) {
          done = true;
          clearTimeout(timeout);
          navigate(session ? '/profile' : '/auth', { replace: true });
        }
      } catch (err) {
        console.error('[auth/callback]', err?.message);
        if (!done) {
          done = true;
          clearTimeout(timeout);
          navigate('/auth', { replace: true });
        }
      }
    }

    handle();

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [navigate]);

  if (errorMsg) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '100vh', gap: 16, padding: 24,
      }}>
        <p style={{
          fontFamily: 'Nunito, sans-serif', fontWeight: 700,
          color: '#C8001E', textAlign: 'center', maxWidth: 360,
        }}>
          {errorMsg}
        </p>
        <button className="co-next-btn" style={{ maxWidth: 220 }} onClick={() => navigate('/auth')}>
          Zurück zur Anmeldung
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <span className="co-spinner" />
    </div>
  );
}
