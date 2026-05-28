const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { pool } = require('../db');

const SALT_ROUNDS = 12;

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

/* ── POST /api/auth/register ────────────────────────────── */
exports.register = async (req, res) => {
  const { email, password, fullName, phone, address } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'E-Mail und Passwort sind erforderlich.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Passwort muss mindestens 6 Zeichen haben.' });
  }

  const norm = email.toLowerCase().trim();

  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [norm]);
  if (existing.rows.length > 0) {
    return res.status(409).json({ error: 'Diese E-Mail ist bereits registriert.' });
  }

  const hash   = await bcrypt.hash(password, SALT_ROUNDS);
  const result = await pool.query(
    'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
    [norm, hash],
  );
  const user = result.rows[0];

  res.status(201).json({ token: signToken(user.id), user });
};

/* ── POST /api/auth/login ───────────────────────────────── */
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'E-Mail und Passwort sind erforderlich.' });
  }

  const norm   = email.toLowerCase().trim();
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [norm]);
  if (result.rows.length === 0) {
    return res.status(401).json({ error: 'Kein Konto mit dieser E-Mail gefunden.' });
  }

  const user  = result.rows[0];
  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    return res.status(401).json({ error: 'Falsches Passwort.' });
  }

  const { password_hash, ...safeUser } = user;
  res.json({ token: signToken(user.id), user: safeUser });
};

/* ── GET /api/auth/me ───────────────────────────────────── */
exports.me = async (req, res) => {
  const result = await pool.query(
    'SELECT id, email, created_at FROM users WHERE id = $1',
    [req.userId],
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Benutzer nicht gefunden.' });
  }
  res.json({ user: result.rows[0] });
};
