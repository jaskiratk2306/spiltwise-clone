// backend/src/routes/settlements.js
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { recomputeBalances } = require('../services/balanceService');

const router = express.Router();
const prisma = new PrismaClient();

router.post('/', authenticate, async (req, res) => {
  try {
    const { paid_by, paid_to, amount, currency, group_id } = req.body;

    const settlement = await prisma.settlement.create({
      data: {
        paid_by,
        paid_to,
        amount,
        currency,
        group_id
      }
    });

    if (group_id) {
      await recomputeBalances(group_id);
    } else {
      await recomputeBalances(null, [paid_by, paid_to]);
    }

    res.status(201).json(settlement);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', authenticate, async (req, res) => {
  const { group_id, friend_id } = req.query;
  const where = {};
  if (group_id) where.group_id = group_id;
  if (friend_id) {
    where.group_id = null;
    where.OR = [
      { paid_by: req.user.userId, paid_to: friend_id },
      { paid_by: friend_id, paid_to: req.user.userId }
    ];
  }

  const settlements = await prisma.settlement.findMany({
    where,
    orderBy: { created_at: 'desc' }
  });
  res.json(settlements);
});

module.exports = router;
