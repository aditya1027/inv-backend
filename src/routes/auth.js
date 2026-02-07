import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../services/db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const loginSchema = z.object({ username: z.string(), password: z.string() });

router.get('/me', authMiddleware, (req, res) => {
  res.json({ id: req.user.sub, username: req.user.username });
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
