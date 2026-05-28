import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log(
  '[Supabase] URL:', supabaseUrl ? `${supabaseUrl.slice(0, 35)}…` : '⚠ MISSING',
  '| Key:', supabaseKey ? `${supabaseKey.slice(0, 18)}…` : '⚠ MISSING'
);

if (!supabaseUrl || !supabaseKey) {
  console.error(
    '[Supabase] Auth will not work — env vars are missing.\n' +
    'Local dev  → add to .env.local\n' +
    'Vercel     → Settings → Environment Variables → add VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY → Redeploy'
  );
}

export const supabase = createClient(supabaseUrl ?? '', supabaseKey ?? '', {
  auth: {
    // implicit flow: session token travels in the URL hash (#access_token=…)
    // instead of a one-time ?code= that requires a localStorage verifier.
    // This makes email-confirmation links work when opened in Gmail webview,
    // Safari, Chrome, or any other browser on mobile.
    flowType:         'implicit',
    detectSessionInUrl: true,
    autoRefreshToken:   true,
    persistSession:     true,
  },
});
