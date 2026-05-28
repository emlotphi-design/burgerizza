require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const authRoutes    = require('./routes/auth');
const burgerRoutes  = require('./routes/burgers');
const pizzaRoutes   = require('./routes/pizzas');
const orderRoutes   = require('./routes/orders');

const app  = express();
const PORT = process.env.PORT || 3001;

/* ── Middleware ─────────────────────────────────────────── */
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  // Hardcoded production frontend — Railway's FRONTEND_URL env var is optional
  // but this ensures CORS never blocks the live Vercel deployment.
  'https://burgerizza-iota.vercel.app',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (mobile apps, curl, Railway health checks)
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

/* ── 404 catch-all ──────────────────────────────────────── */
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

/* ── Global error handler ────────────────────────────────── */
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Burgerizza API running on port ${PORT}`);
});
