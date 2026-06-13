// backend/src/routes/balances.js
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;

    const balances = await prisma.balance.findMany({
      where: {
        OR: [
          { user_id_from: userId },
          { user_id_to: userId }
        ]
      },
      include: {
        from_user: { select: { name: true } },
        to_user: { select: { name: true } },
        group: { select: { name: true } }
      }
    });

    res.json(balances);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
