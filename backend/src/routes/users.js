// backend/src/routes/users.js
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { z } = require('zod');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/search', authenticate, async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.json([]);

    const users = await prisma.user.findMany({
      where: {
        email: { contains: email },
        OR: [
          { is_ghost: false },
          { email: email } // Show ghost if it matches exactly
        ]
      },
      take: 10,
      select: {
        id: true,
        name: true,
        email: true,
        is_ghost: true
      }
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/me', authenticate, async (req, res) => {
  try {
    const { name, base_currency } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: { name, base_currency },
      select: {
        id: true,
        name: true,
        email: true,
        base_currency: true
      }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
