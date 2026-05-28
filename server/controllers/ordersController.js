const prisma = require('../utils/prisma');

/* ── POST /api/orders ───────────────────────────────────── */
exports.create = async (req, res) => {
  const { items, totalPrice } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Bestellung ist leer.' });
  }
  if (typeof totalPrice !== 'number' || totalPrice <= 0) {
    return res.status(400).json({ error: 'Ungültiger Gesamtbetrag.' });
  }

  const order = await prisma.order.create({
    data: {
      userId:     req.userId,
      items,
      totalPrice,
      status:     'pending',
    },
  });

  res.status(201).json({ order });
};

/* ── GET /api/orders ────────────────────────────────────── */
exports.list = async (req, res) => {
  const orders = await prisma.order.findMany({
    where:   { userId: req.userId },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ orders });
};

/* ── GET /api/orders/:id ────────────────────────────────── */
exports.get = async (req, res) => {
  const { id } = req.params;
  const order  = await prisma.order.findUnique({ where: { id } });
  if (!order || order.userId !== req.userId) {
    return res.status(404).json({ error: 'Bestellung nicht gefunden.' });
  }
  res.json({ order });
};
