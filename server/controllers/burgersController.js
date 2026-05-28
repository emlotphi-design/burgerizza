const prisma = require('../utils/prisma');

/* ── POST /api/burgers ──────────────────────────────────── */
exports.create = async (req, res) => {
  try {
    const { name, bun, sauces, meats, cheeses, vegetables, totalPrice, image } = req.body;

    if (!name || !bun) {
      return res.status(400).json({ error: 'Name und Brötchen sind erforderlich.' });
    }

    const burger = await prisma.burger.create({
      data: {
        name,
        bun,
        sauces:     sauces     ?? [],
        meats:      meats      ?? {},
        cheeses:    cheeses    ?? {},
        vegetables: vegetables ?? [],
        totalPrice: totalPrice ?? 0,
        image:      image      ?? null,
        userId:     req.userId,
      },
    });

    res.status(201).json({ burger });
  } catch (err) {
    console.error('[burgers] create:', err.message);
    res.status(500).json({ error: 'Burger konnte nicht gespeichert werden.' });
  }
};

/* ── GET /api/burgers ───────────────────────────────────── */
exports.list = async (req, res) => {
  try {
    const burgers = await prisma.burger.findMany({
      where:   { userId: req.userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ burgers });
  } catch (err) {
    console.error('[burgers] list:', err.message);
    res.status(500).json({ error: 'Burgers konnten nicht geladen werden.' });
  }
};

/* ── DELETE /api/burgers/:id ────────────────────────────── */
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const burger = await prisma.burger.findUnique({ where: { id } });
    if (!burger || burger.userId !== req.userId) {
      return res.status(404).json({ error: 'Burger nicht gefunden.' });
    }
    await prisma.burger.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    console.error('[burgers] remove:', err.message);
    res.status(500).json({ error: 'Burger konnte nicht gelöscht werden.' });
  }
};
