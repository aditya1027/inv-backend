import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../services/db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const loginSchema = z.object({ username: z.string(), password: z.string() });
const signupSchema = z.object({
  username: z.string().min(1, 'Username is required').max(64),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

router.get('/me', authMiddleware, (req, res) => {
  res.json({ id: req.user.sub, username: req.user.username });
});

router.post('/signup', async (req, res, next) => {
  try {
    const body = signupSchema.parse(req.body);
    const existing = await prisma.admin.findUnique({ where: { username: body.username } });
    if (existing) {
      return res.status(409).json({ error: 'Username already taken' });
    }
    const passwordHash = await bcrypt.hash(body.password, 10);
    const admin = await prisma.admin.create({
      data: { username: body.username, passwordHash },
    });
    const token = jwt.sign(
      { sub: admin.id, username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.status(201).json({ token, user: { id: admin.id, username: admin.username } });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors?.[0]?.message || 'Invalid input' });
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const admin = await prisma.admin.findUnique({ where: { username: body.username } });
    if (!admin || !(await bcrypt.compare(body.password, admin.passwordHash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { sub: admin.id, username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token, user: { id: admin.id, username: admin.username } });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: 'Invalid input' });
    next(err);
  }
});

export default router;
