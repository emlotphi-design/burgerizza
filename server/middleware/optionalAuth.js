let supabaseClient;
try {
  const { createClient } = require('@supabase/supabase-js');
  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    supabaseClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
  }
} catch {}

// Sets req.userId to the real Supabase UUID when a valid token is present,
// otherwise falls back to 'demo-user' so routes work without authentication.
module.exports = async function optionalAuth(req, _res, next) {
  req.userId = 'demo-user';
  const header = req.headers.authorization;
  if (supabaseClient && header?.startsWith('Bearer ')) {
    try {
      const token = header.slice(7);
      const { data: { user } } = await supabaseClient.auth.getUser(token);
      if (user?.id) req.userId = user.id;
    } catch {}
  }
  next();
};
