require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const { createTables } = require('./db');
const authRoutes   = require('./routes/auth');
const burgerRoutes = require('./routes/burgers');
const pizzaRoutes  = require('./routes/pizzas');
const orderRoutes  = require('./routes/orders');

const app  = express();
const PORT = process.env.PORT || 3001;

/* ── CORS ───────────────────────────────────────────────── */
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

app.use(express.json());

/* ── Routes ─────────────────────────────────────────────── */
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString() });
});

app.use('/api/auth',    authRoutes);
app.use('/api/burgers', burgerRoutes);
app.use('/api/pizzas',  pizzaRoutes);
app.use('/api/orders',  orderRoutes);

/* ── 404 ────────────────────────────────────────────────── */
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

/* ── Global error handler ────────────────────────────────── */
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

/* ── Boot: create DB tables, then listen ────────────────── */
async function start() {
  await createTables();
  app.listen(PORT, () => console.log(`Burgerizza API on port ${PORT}`));
}

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
