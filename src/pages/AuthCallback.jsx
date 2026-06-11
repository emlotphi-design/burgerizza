import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const url       = new URL(window.location.href);
    const code      = url.searchParams.get('code');
    const errorDesc = url.searchParams.get('error_description');

    // ── TEMP DEBUG — log URL structure on arrival (code value redacted) ──
    console.log('[link] /auth/callback received:', {
      path:        url.pathname,
      hasCode:     !!code,
      codeLength:  code?.length ?? 0,
      // Supabase PKCE flow sends ?code=... (query param).
      // Hash-based implicit flow sends #access_token=... (fragment).
      // If hasCode=false and hash is non-empty → project may be in implicit flow mode.
      hasHash:     url.hash.length > 1,
      hashKeys:    url.hash.length > 1
        ? new URLSearchParams(url.hash.slice(1)).keys().next().value
        : null,
      errorParam:  errorDesc ?? null,
    });

    if (errorDesc) {
      console.error('[link] error_description in URL:', errorDesc);
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
      console.log('[token] onAuthStateChange:', event, '| session present:', !!session);
      if (event === 'PASSWORD_RECOVERY' && session) {
        console.log('[token] ✅ PASSWORD_RECOVERY confirmed — token is valid, redirecting to reset form');
        navigate('/auth?reset=1', { replace: true });
      } else if (event === 'SIGNED_IN' && session) {
        console.log('[token] SIGNED_IN — email confirmation link (not reset)');
        navigate('/profile', { replace: true });
      } else {
        console.warn('[token] unexpected state — event:', event, '| navigating to /auth');
        navigate(session ? '/profile' : '/auth', { replace: true });
      }
    });

    async function handle() {
      try {
        if (code) {
          console.log('[token] PKCE code present in URL — length:', code.length);
          console.log('[token] attempting exchangeCodeForSession…');

          const { data, error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            console.error('[token] ❌ exchange FAILED:', {
              message:  error.message,
              code:     error.code,
              status:   error.status,
              // Common causes:
              // "invalid_grant"        → token already used or expired (1 hr TTL)
              // "code verifier missing"→ different browser / incognito from the one that sent the request
              // "bad request"          → malformed URL (link truncated by email client)
            });
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

          // Token was valid and exchanged successfully
          const session = data?.session;
          console.log('[token] ✅ exchange SUCCESS:', {
            userId:    session?.user?.id     ?? '—',
            email:     session?.user?.email  ?? '—',
            expiresAt: session?.expires_at   ?? '—',  // Unix timestamp
            expiresIn: session?.expires_in   ?? '—',  // seconds remaining
            tokenType: session?.token_type   ?? '—',
          });

          // onAuthStateChange fires PASSWORD_RECOVERY → redirects to /auth?reset=1
          return;
        }

        // No code — just check for an existing session
        console.log('[token] no code in URL — checking existing session');
        const { data: { session } } = await supabase.auth.getSession();
        if (!done) {
          done = true;
          clearTimeout(timeout);
          navigate(session ? '/profile' : '/auth', { replace: true });
        }
      } catch (err) {
        console.error('[token] unexpected exception during exchange:', err?.message);
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
          color: '#FF3B30', textAlign: 'center', maxWidth: 360,
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
