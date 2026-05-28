import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// VITE_SITE_URL must be set in Vercel → Settings → Environment Variables:
//   VITE_SITE_URL = https://burgerizza-iota.vercel.app
// Falls back to current origin so local dev still works without extra setup.
export const SITE_URL = (import.meta.env.VITE_SITE_URL ?? window.location.origin)
  .replace(/\/$/, '');          // strip any trailing slash

console.log(
  '[Supabase] URL:', supabaseUrl ? `${supabaseUrl.slice(0, 35)}…` : '⚠ MISSING',
  '| Key:', supabaseKey ? `${supabaseKey.slice(0, 18)}…` : '⚠ MISSING',
  '| SITE_URL:', SITE_URL
);

if (!supabaseUrl || !supabaseKey) {
  console.error(
    '[Supabase] Auth will not work — env vars are missing.\n' +
    'Local dev  → add VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY to .env.local\n' +
    'Vercel     → Settings → Environment Variables → add both vars + VITE_SITE_URL → Redeploy'
  );
}

export const supabase = createClient(supabaseUrl ?? '', supabaseKey ?? '', {
  auth: {
    // Implicit flow: session token travels in the URL hash (#access_token=…)
    // — no localStorage code-verifier needed, so it works when Gmail / Mail
    // app opens the confirmation link in a webview or a different browser.
    flowType:           'implicit',
    detectSessionInUrl: true,
    autoRefreshToken:   true,
    persistSession:     true,
  },
});
