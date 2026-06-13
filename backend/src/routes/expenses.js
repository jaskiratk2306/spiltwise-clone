// backend/src/routes/expenses.js
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { recomputeBalances } = require('../services/balanceService');
const { z } = require('zod');

const router = express.Router();
const prisma = new PrismaClient();

const expenseSchema = z.object({
  description: z.string(),
  total_amount: z.number().positive(),
  currency: z.string().default('INR'),
  paid_by: z.string(),
  split_type: z.enum(['EQUAL', 'EXACT', 'PERCENTAGE', 'SHARES']),
  group_id: z.string().nullable().optional(),
  friend_id: z.string().nullable().optional(), // for 1-on-1
  splits: z.array(z.object({
    user_id: z.string(),
    share_value: z.number()
  }))
});

router.post('/', authenticate, async (req, res) => {
  try {
    const data = expenseSchema.parse(req.body);
    const { splits, ...expenseData } = data;

    // Validate splits based on type
    let calculatedSplits = [];
    if (data.split_type === 'EQUAL') {
      const perPerson = data.total_amount / splits.length;
      calculatedSplits = splits.map(s => ({ ...s, owed_amount: perPerson }));
    } else if (data.split_type === 'EXACT') {
      const sum = splits.reduce((acc, s) => acc + s.share_value, 0);
      if (Math.abs(sum - data.total_amount) > 0.01) return res.status(400).json({ error: 'Exact amounts must sum to total' });
      calculatedSplits = splits.map(s => ({ ...s, owed_amount: s.share_value }));
    } else if (data.split_type === 'PERCENTAGE') {
      const sum = splits.reduce((acc, s) => acc + s.share_value, 0);
      if (Math.abs(sum - 100) > 0.01) return res.status(400).json({ error: 'Percentages must sum to 100' });
      calculatedSplits = splits.map(s => ({ ...s, owed_amount: (s.share_value / 100) * data.total_amount }));
    } else if (data.split_type === 'SHARES') {
      const totalShares = splits.reduce((acc, s) => acc + s.share_value, 0);
      calculatedSplits = splits.map(s => ({ ...s, owed_amount: (s.share_value / totalShares) * data.total_amount }));
    }

    const expense = await prisma.$transaction(async (tx) => {
      const exp = await tx.expense.create({
        data: {
          description: data.description,
          total_amount: data.total_amount,
          currency: data.currency,
          paid_by: data.paid_by,
          split_type: data.split_type,
          group_id: data.group_id,
          created_by: req.user.userId,
          splits: {
            create: calculatedSplits.map(s => ({
              user_id: s.user_id,
              owed_amount: s.owed_amount,
              share_value: s.share_value
            }))
          }
        },
        include: { splits: true }
      });
      return exp;
    });

    // Recompute balances
    if (data.group_id) {
      await recomputeBalances(data.group_id);
    } else if (data.friend_id) {
      await recomputeBalances(null, [req.user.userId, data.friend_id]);
    }

    res.status(201).json(expense);
  } catch (error) {
    console.error(error);
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', authenticate, async (req, res) => {
  const { group_id, friend_id } = req.query;
  const where = { deleted_at: null };
  if (group_id) where.group_id = group_id;
  if (friend_id) {
    where.group_id = null;
    where.OR = [
      { paid_by: req.user.userId, splits: { some: { user_id: friend_id } } },
      { paid_by: friend_id, splits: { some: { user_id: req.user.userId } } }
    ];
  }

  const expenses = await prisma.expense.findMany({
    where,
    include: { payer: { select: { name: true } } },
    orderBy: { created_at: 'desc' }
  });
  res.json(expenses);
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const expense = await prisma.expense.findUnique({ where: { id: req.params.id } });
    if (!expense) return res.status(404).json({ error: 'Expense not found' });

    await prisma.expense.update({
      where: { id: req.params.id },
      data: { deleted_at: new Date() }
    });

    if (expense.group_id) {
      await recomputeBalances(expense.group_id);
    } else {
      // Find the other user from splits
      const splits = await prisma.expenseSplit.findMany({ where: { expense_id: expense.id } });
      const otherUser = splits.find(s => s.user_id !== expense.paid_by)?.user_id;
      if (otherUser) await recomputeBalances(null, [expense.paid_by, otherUser]);
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
