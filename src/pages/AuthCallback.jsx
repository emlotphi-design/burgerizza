import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const url       = new URL(window.location.href);
    const code      = url.searchParams.get('code');
    const errorDesc = url.searchParams.get('error_description');

    if (errorDesc) {
      setErrorMsg(decodeURIComponent(errorDesc.replace(/\+/g, ' ')));
      return;
    }

    let done = false;

    const timeout = setTimeout(() => {
      if (!done) {
        done = true;
        console.warn('[auth/callback] timeout — redirecting to /auth');
        navigate('/auth', { replace: true });
      }
    }, 6000);

    // onAuthStateChange fires once the PKCE code exchange completes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (done) return;
      done = true;
      clearTimeout(timeout);
      console.log('[auth/callback] event:', event, '| session:', !!session);
      if (event === 'PASSWORD_RECOVERY' && session) {
        navigate('/auth?reset=1', { replace: true });
      } else {
        navigate(session ? '/profile' : '/auth', { replace: true });
      }
    });

    async function handle() {
      try {
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
          // onAuthStateChange handles the redirect after exchange
          return;
        }

        // No code — just check for an existing session
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
