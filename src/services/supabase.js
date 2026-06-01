import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Probe which storage backend is usable in this browser context.
// iOS Safari private mode and most in-app WebViews (Instagram, Telegram, WhatsApp)
// throw QuotaExceededError on localStorage.setItem, silently breaking Supabase
// session persistence. We cascade: localStorage → sessionStorage → in-memory.
// sessionStorage survives in-page navigation but not new tabs.
// Memory survives only the current page load — user must re-login after a hard
// refresh, but at least the session works for the current visit.
function probeStorage() {
  function canUse(store) {
    try {
      store.setItem('__sb_probe__', '1');
      store.removeItem('__sb_probe__');
      return true;
    } catch {
      return false;
    }
  }
  if (typeof window !== 'undefined') {
    if (canUse(window.localStorage))   return { type: 'localStorage',   store: window.localStorage };
    if (canUse(window.sessionStorage)) return { type: 'sessionStorage', store: window.sessionStorage };
  }
  const mem = new Map();
  return {
    type: 'memory',
    store: {
      getItem:    (k) => mem.get(k) ?? null,
      setItem:    (k, v) => mem.set(k, v),
      removeItem: (k) => mem.delete(k),
    },
  };
}

const { type: _storageType, store: _robustStorage } = probeStorage();
export const storageType = _storageType;

export const SITE_URL = (import.meta.env.VITE_SITE_URL ?? window.location.origin)
  .replace(/\/$/, '');

// Redirect URL used for every Supabase auth email (signup, password reset).
// Must be listed in: Supabase Dashboard → Auth → URL Configuration → Redirect URLs
// In production this is https://burgerizza-iota.vercel.app/auth/callback
// Override via VITE_SITE_URL env var for staging environments.
export const AUTH_REDIRECT = `${SITE_URL}/auth/callback`;

console.log(
  '[Supabase] URL:', supabaseUrl ? `${supabaseUrl.slice(0, 35)}…` : '⚠ MISSING',
  '| Key:', supabaseKey ? `${supabaseKey.slice(0, 18)}…` : '⚠ MISSING',
  '| SITE_URL:', SITE_URL,
);

const canInit = !!(supabaseUrl && supabaseKey);

if (!canInit) {
  console.error(
    '[Supabase] createClient skipped — env vars are missing.\n' +
    'Local dev  → add VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY to .env.local\n' +
    'Vercel     → Settings → Environment Variables → add both vars + VITE_SITE_URL → Redeploy',
  );
}

// When env vars are absent (e.g. a Vercel build without the vars configured),
// createClient throws synchronously with "supabaseKey is required", which kills
// the entire JS bundle before React mounts — leaving only the CSS background.
// The stub below keeps the app rendering; auth calls will all resolve as errors.
const supabaseStub = {
  auth: {
    getSession:               async ()  => ({ data: { session: null }, error: null }),
    onAuthStateChange:        (cb)      => { setTimeout(() => cb('INITIAL_SESSION', null), 0); return { data: { subscription: { unsubscribe: () => {} } } }; },
    signUp:                   async ()  => ({ data: { user: null, session: null }, error: { message: 'Supabase not configured' } }),
    signInWithPassword:       async ()  => ({ data: { user: null, session: null }, error: { message: 'Supabase not configured' } }),
    signOut:                  async ()  => ({ error: null }),
    getUser:                  async ()  => ({ data: { user: null }, error: null }),
    resend:                   async ()  => ({ error: { message: 'Supabase not configured' } }),
    updateUser:               async ()  => ({ data: { user: null }, error: null }),
    resetPasswordForEmail:    async ()  => ({ error: { message: 'Supabase not configured' } }),
    exchangeCodeForSession:   async ()  => ({ error: { message: 'Supabase not configured' } }),
    signInWithOtp:            async ()  => ({ error: { message: 'Supabase not configured' } }),
    verifyOtp:                async ()  => ({ error: { message: 'Supabase not configured' } }),
  },
};

export const supabase = canInit
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        flowType:           'pkce',
        detectSessionInUrl: true,
        autoRefreshToken:   true,
        persistSession:     true,
        storage:            _robustStorage,
      },
    })
  : supabaseStub;
