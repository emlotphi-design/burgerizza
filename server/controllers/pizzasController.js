const prisma = require('../utils/prisma');

/* ── POST /api/pizzas ───────────────────────────────────── */
exports.create = async (req, res) => {
  const { name, dough, sauce, cheese, meats, vegetables, totalPrice, image } = req.body;

  if (!name || !dough || !sauce || !cheese) {
    return res.status(400).json({ error: 'Name, Teig, Sauce und Käse sind erforderlich.' });
  }

  const pizza = await prisma.pizza.create({
    data: {
      name,
      dough,
      sauce,
      cheese,
      meats:      meats      ?? [],
      vegetables: vegetables ?? [],
      totalPrice: totalPrice ?? 0,
      image:      image      ?? null,
      userId:     req.userId,
    },
  });

  res.status(201).json({ pizza });
};

/* ── GET /api/pizzas ────────────────────────────────────── */
exports.list = async (req, res) => {
  const pizzas = await prisma.pizza.findMany({
    where:   { userId: req.userId },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ pizzas });
};

/* ── DELETE /api/pizzas/:id ─────────────────────────────── */
exports.remove = async (req, res) => {
  const { id } = req.params;
  const pizza = await prisma.pizza.findUnique({ where: { id } });
  if (!pizza || pizza.userId !== req.userId) {
    return res.status(404).json({ error: 'Pizza nicht gefunden.' });
  }
  await prisma.pizza.delete({ where: { id } });
  res.json({ ok: true });
};
