import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/db';
import { hashPassword, verifyPassword } from '../lib/hash';
import { signAccessToken } from '../lib/jwt';
import { authRequired } from '../middleware/auth';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).optional(),
  password: z.string().min(6).max(64),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(64),
});

router.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.flatten() });

  const { email, name, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ ok: false, error: 'Email already registered' });

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, name, passwordHash, role: 'OWNER' },
    select: { id: true, email: true, name: true, role: true, suspended: true, createdAt: true },
  });

  const access = signAccessToken({ sub: user.id, email: user.email, role: user.role });
  return res.status(201).json({ ok: true, user, tokens: { access } });
});

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.flatten() });

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ ok: false, error: 'Invalid credentials' });
  if (user.suspended) return res.status(403).json({ ok: false, error: 'User suspended' });

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return res.status(401).json({ ok: false, error: 'Invalid credentials' });

  const access = signAccessToken({ sub: user.id, email: user.email, role: user.role });
  const safeUser = { id: user.id, email: user.email, name: user.name, role: user.role, suspended: user.suspended, createdAt: user.createdAt };
  return res.json({ ok: true, user: safeUser, tokens: { access } });
});

router.get('/me', authRequired, async (req, res) => {
  // req.user is set by authRequired
  return res.json({ ok: true, user: req.user });
});

export default router;
