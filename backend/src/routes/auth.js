// backend/src/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { z } = require('zod');

const router = express.Router();
const prisma = new PrismaClient();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

router.post('/register', async (req, res) => {
  try {
    console.log('Register request:', req.body);
    const { name, email, password } = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findFirst({
      where: { email, is_ghost: false }
    });

    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    let user;
    const ghostUser = await prisma.user.findFirst({
      where: { email, is_ghost: true }
    });

    if (ghostUser) {
      // Ghost merge logic (simplified for now, following §7 AI_CONTEXT)
      user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.update({
          where: { id: ghostUser.id },
          data: {
            name,
            password_hash,
            is_ghost: false
          }
        });
        return newUser;
      });
    } else {
      user = await prisma.user.create({
        data: {
          name,
          email,
          password_hash,
          is_ghost: false
        }
      });
    }

    // Automatically add user to Imported Expenses group
    const importedGroup = await prisma.group.findFirst({
      where: { name: 'Imported Expenses' }
    });
    if (importedGroup && user) {
      try {
        await prisma.groupMember.create({
          data: { group_id: importedGroup.id, user_id: user.id }
        });
      } catch (e) {
        // Ignore unique constraint error if already in group
      }
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    const { password_hash: _, ...userWithoutPassword } = user;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error('Registration error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || user.is_ghost || !user.password_hash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Automatically add user to Imported Expenses group
    const importedGroup = await prisma.group.findFirst({
      where: { name: 'Imported Expenses' }
    });
    if (importedGroup && user) {
      try {
        await prisma.groupMember.create({
          data: { group_id: importedGroup.id, user_id: user.id }
        });
      } catch (e) {
        // Ignore unique constraint error if already in group
      }
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    const { password_hash: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

router.get('/me', authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.userId }
  });
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  const { password_hash: _, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

module.exports = router;
