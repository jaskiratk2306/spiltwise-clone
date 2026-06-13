// backend/src/routes/friends.js
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', authenticate, async (req, res) => {
  try {
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { user_id_1: req.user.userId },
          { user_id_2: req.user.userId }
        ]
      },
      include: {
        user1: { select: { id: true, name: true, email: true, is_ghost: true } },
        user2: { select: { id: true, name: true, email: true, is_ghost: true } }
      }
    });

    const friends = friendships.map(f => f.user_id_1 === req.user.userId ? f.user2 : f.user1);
    res.json(friends);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { email } = req.body;
    let friend = await prisma.user.findUnique({ where: { email } });

    if (!friend) {
      friend = await prisma.user.create({
        data: {
          email,
          name: email.split('@')[0],
          is_ghost: true
        }
      });
    }

    const userId1 = req.user.userId < friend.id ? req.user.userId : friend.id;
    const userId2 = req.user.userId < friend.id ? friend.id : req.user.userId;

    const friendship = await prisma.friendship.create({
      data: {
        user_id_1: userId1,
        user_id_2: userId2
      }
    });

    res.status(201).json(friend);
  } catch (error) {
    if (error.code === 'P2002') return res.status(409).json({ error: 'Already friends' });
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
