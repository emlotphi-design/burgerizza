import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const SITE_URL = (import.meta.env.VITE_SITE_URL ?? window.location.origin)
  .replace(/\/$/, '');

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
    getSession:          async ()  => ({ data: { session: null }, error: null }),
    onAuthStateChange:   ()        => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signUp:              async ()  => ({ data: { user: null, session: null }, error: { message: 'Supabase not configured' } }),
    signInWithPassword:  async ()  => ({ data: { user: null, session: null }, error: { message: 'Supabase not configured' } }),
    signOut:             async ()  => ({ error: null }),
    getUser:             async ()  => ({ data: { user: null }, error: null }),
    resend:              async ()  => ({ error: { message: 'Supabase not configured' } }),
    updateUser:          async ()  => ({ data: { user: null }, error: null }),
  },
};

export const supabase = canInit
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        flowType:           'implicit',
        detectSessionInUrl: true,
        autoRefreshToken:   true,
        persistSession:     true,
      },
    })
  : supabaseStub;
