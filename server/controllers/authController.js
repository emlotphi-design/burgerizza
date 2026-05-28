// Auth is now handled directly by Supabase on the frontend.
// These routes are no longer called by the app but are kept for reference.

exports.register = (_req, res) =>
  res.status(410).json({ message: 'Use Supabase Auth directly from the frontend.' });

exports.login = (_req, res) =>
  res.status(410).json({ message: 'Use Supabase Auth directly from the frontend.' });

exports.me = (req, res) =>
  res.json({ userId: req.userId });
