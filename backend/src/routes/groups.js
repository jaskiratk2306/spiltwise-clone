// backend/src/routes/groups.js
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { z } = require('zod');

const router = express.Router();
const prisma = new PrismaClient();

const groupSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  base_currency: z.string().default('INR')
});

router.get('/', authenticate, async (req, res) => {
  try {
    const groups = await prisma.group.findMany({
      where: {
        members: { some: { user_id: req.user.userId } }
      },
      include: {
        _count: { select: { members: true } }
      }
    });

    // In a real app, we'd also include the user's net balance in each group.
    // For now, returning basic list.
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { name, description, base_currency } = groupSchema.parse(req.body);
    const group = await prisma.group.create({
      data: {
        name,
        description,
        base_currency,
        created_by: req.user.userId,
        members: {
          create: { user_id: req.user.userId }
        }
      }
    });
    res.status(201).json(group);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const group = await prisma.group.findFirst({
      where: {
        id: req.params.id,
        members: { some: { user_id: req.user.userId } }
      },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true, is_ghost: true } } } },
        expenses: {
          where: { deleted_at: null },
          orderBy: { created_at: 'desc' },
          take: 50
        },
        balances: true
      }
    });

    if (!group) return res.status(404).json({ error: 'Group not found' });
    res.json(group);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/members', authenticate, async (req, res) => {
  try {
    const { email } = req.body;
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Create ghost user
      user = await prisma.user.create({
        data: {
          email,
          name: email.split('@')[0],
          is_ghost: true
        }
      });
    }

    const member = await prisma.groupMember.create({
      data: {
        group_id: req.params.id,
        user_id: user.id
      }
    });

    res.status(201).json(member);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
