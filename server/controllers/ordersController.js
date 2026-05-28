const prisma = require('../utils/prisma');

/* ── POST /api/orders ───────────────────────────────────── */
exports.create = async (req, res) => {
  try {
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

    console.log(`[orders] created: id=${order.id} user=${order.userId} total=€${totalPrice.toFixed(2)} items=${items.length}`);
    res.status(201).json({ order });
  } catch (err) {
    console.error('[orders] create:', err.message);
    res.status(500).json({ error: 'Bestellung konnte nicht gespeichert werden.' });
  }
};

/* ── GET /api/orders ────────────────────────────────────── */
exports.list = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where:   { userId: req.userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ orders });
  } catch (err) {
    console.error('[orders] list:', err.message);
    res.status(500).json({ error: 'Bestellungen konnten nicht geladen werden.' });
  }
};

/* ── GET /api/orders/:id ────────────────────────────────── */
exports.get = async (req, res) => {
  try {
    const { id } = req.params;
    const order  = await prisma.order.findUnique({ where: { id } });
    if (!order || order.userId !== req.userId) {
      return res.status(404).json({ error: 'Bestellung nicht gefunden.' });
    }
    res.json({ order });
  } catch (err) {
    console.error('[orders] get:', err.message);
    res.status(500).json({ error: 'Bestellung konnte nicht geladen werden.' });
  }
};
