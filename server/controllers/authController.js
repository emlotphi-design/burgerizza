const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const prisma = require('../utils/prisma');

const SALT_ROUNDS = 12;

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

function safeUser(user) {
  const { password, ...rest } = user;
  return rest;
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
  const existing = await prisma.user.findUnique({ where: { email: norm } });
  if (existing) {
    return res.status(409).json({ error: 'Diese E-Mail ist bereits registriert.' });
  }

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const user   = await prisma.user.create({
    data: {
      email:    norm,
      password: hashed,
      fullName: fullName ?? null,
      phone:    phone    ?? null,
      address:  address  ?? null,
    },
  });

  res.status(201).json({ token: signToken(user.id), user: safeUser(user) });
};

/* ── POST /api/auth/login ───────────────────────────────── */
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'E-Mail und Passwort sind erforderlich.' });
  }

  const norm = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email: norm } });
  if (!user) {
    return res.status(401).json({ error: 'Kein Konto mit dieser E-Mail gefunden.' });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(401).json({ error: 'Falsches Passwort.' });
  }

  res.json({ token: signToken(user.id), user: safeUser(user) });
};

/* ── GET /api/auth/me ───────────────────────────────────── */
exports.me = async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) return res.status(404).json({ error: 'Benutzer nicht gefunden.' });
  res.json({ user: safeUser(user) });
};
