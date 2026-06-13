// backend/src/routes/activity.js
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Fetch expenses where user is involved
    const expenses = await prisma.expense.findMany({
      where: {
        deleted_at: null,
        OR: [
          { paid_by: userId },
          { splits: { some: { user_id: userId } } }
        ]
      },
      include: {
        payer: { select: { name: true } },
        group: { select: { name: true } }
      },
      orderBy: { created_at: 'desc' },
      take: limit,
      skip: skip
    });

    // Fetch settlements where user is involved
    const settlements = await prisma.settlement.findMany({
      where: {
        OR: [
          { paid_by: userId },
          { paid_to: userId }
        ]
      },
      include: {
        payer: { select: { name: true } },
        receiver: { select: { name: true } },
        group: { select: { name: true } }
      },
      orderBy: { created_at: 'desc' },
      take: limit,
      skip: skip
    });

    // Combine and sort
    const activity = [
      ...expenses.map(e => ({
        id: e.id,
        type: 'EXPENSE',
        description: e.description,
        amount: e.total_amount,
        currency: e.currency,
        payer: e.payer.name,
        group: e.group ? e.group.name : null,
        created_at: e.created_at
      })),
      ...settlements.map(s => ({
        id: s.id,
        type: 'SETTLEMENT',
        description: `Settled up with ${s.receiver.name}`,
        amount: s.amount,
        currency: s.currency,
        payer: s.payer.name,
        group: s.group ? s.group.name : null,
        created_at: s.created_at
      }))
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
     .slice(0, limit);

    res.json(activity);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
