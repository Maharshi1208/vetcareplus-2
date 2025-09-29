import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/db.js';
import { hashPassword, verifyPassword } from '../lib/hash.js';
import { signAccessToken } from '../lib/jwt.js';
import { authRequired } from '../middleware/auth.js';
import type { AuthedRequest } from '../middleware/auth.js';
import crypto from 'crypto';
import { env } from '../config/env.js';
import sendMail from '../lib/mailer.js';

const router = Router();

/* ------------------------ Schemas ------------------------ */
const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).optional(),
  password: z.string().min(6).max(64),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(64),
});

/* ------------------------ Auth: Register (PUBLIC) ------------------------ */
router.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  }

  const { email, name, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ ok: false, error: 'Email already registered' });
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, name, passwordHash, role: 'OWNER' },
    select: { id: true, email: true, name: true, role: true, suspended: true, createdAt: true },
  });

  const access = signAccessToken({ sub: user.id, email: user.email, role: user.role });
  return res.status(201).json({ ok: true, user, tokens: { access } });
});

/* ------------------------ Auth: Login (PUBLIC) ------------------------ */
router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ ok: false, error: 'Invalid credentials' });
  if (user.suspended) return res.status(403).json({ ok: false, error: 'User suspended' });

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return res.status(401).json({ ok: false, error: 'Invalid credentials' });

  const access = signAccessToken({ sub: user.id, email: user.email, role: user.role });
  const safeUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    suspended: user.suspended,
    createdAt: user.createdAt,
  };
  return res.json({ ok: true, user: safeUser, tokens: { access } });
});

/* ------------------------ Me (AUTH REQUIRED) ------------------------ */
router.get('/me', authRequired, async (req: AuthedRequest, res) => {
  const me = await prisma.user.findUnique({
    where: { id: req.user!.sub }, // AuthedRequest has .sub
    select: { id: true, email: true, name: true, role: true, suspended: true, createdAt: true },
  });
  if (!me) return res.status(404).json({ ok: false, error: 'Not found' });
  return res.json({ ok: true, user: me });
});

/* ------------------------ Password Reset: Request (PUBLIC) ------------------------ */
/**
 * POST /auth/request-reset
 * body: { email: string }
 * Always 200 (avoid account enumeration).
 */
router.post('/request-reset', async (req: Request, res: Response) => {
  const { email } = req.body ?? {};
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ ok: false, error: 'Email is required' });
  }

  // Find user (case-insensitive)
  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
    select: { id: true, email: true, name: true },
  });

  // Always return ok:true (don’t leak account existence)
  if (!user) return res.json({ ok: true });

  // Invalidate previous unused tokens
  await prisma.resetToken.updateMany({
    where: { userId: user.id, usedAt: null, expiresAt: { gt: new Date() } },
    data: { expiresAt: new Date() },
  });

  // Create token
  const raw = crypto.randomBytes(32).toString('hex'); // 64 chars
  const token = `${raw}.${crypto.randomBytes(6).toString('hex')}`;
  const ttlMinutes = 30;
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

  await prisma.resetToken.create({ data: { userId: user.id, token, expiresAt } });

  // Build base URL for the frontend reset page
  const base =
    env.RESET_LINK_BASE ??
    (env.FRONTEND_URL
      ? `${env.FRONTEND_URL.replace(/\/$/, '')}/reset-password`
      : `${env.CORS_ORIGIN.replace(/\/$/, '')}/reset-password`);

  const resetUrl =
    base.includes('?')
      ? `${base}&token=${encodeURIComponent(token)}`
      : `${base}?token=${encodeURIComponent(token)}`;

  // Email it (MailHog in dev)
  try {
    await sendMail({
      to: user.email,
      subject: 'Password reset instructions',
      html: `
        <p>Hello${user.name ? ' ' + user.name : ''},</p>
        <p>We received a request to reset your VetCare+ password.</p>
        <p>Click the link below to set a new password (valid for ${ttlMinutes} minutes):</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>If you did not request this, you can safely ignore this email.</p>
      `,
      text: `Reset your VetCare+ password: ${resetUrl}`,
    });
  } catch (err) {
    // Don’t fail the response on email transport hiccups; user can request again
    console.error('sendMail error (request-reset):', err);
  }

  return res.json({ ok: true });
});

/* ------------------------ Password Reset: Perform (PUBLIC) ------------------------ */
router.post('/reset-password', async (req: Request, res: Response) => {
  const { token, password } = req.body ?? {};
  if (!token || typeof token !== 'string' || !password || typeof password !== 'string') {
    return res.status(400).json({ ok: false, error: 'token and password are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ ok: false, error: 'Password must be at least 8 characters' });
  }

  const rt = await prisma.resetToken.findFirst({
    where: { token },
    select: { id: true, userId: true, expiresAt: true, usedAt: true },
  });

  if (!rt) return res.status(400).json({ ok: false, error: 'Invalid or expired token' });
  if (rt.usedAt) return res.status(400).json({ ok: false, error: 'Token already used' });
  if (rt.expiresAt <= new Date()) return res.status(400).json({ ok: false, error: 'Token expired' });

  const hashed = await hashPassword(password);
  await prisma.$transaction([
    prisma.user.update({ where: { id: rt.userId }, data: { passwordHash: hashed } }),
    prisma.resetToken.update({ where: { id: rt.id }, data: { usedAt: new Date() } }),
  ]);

  return res.json({ ok: true, message: 'Password updated' });
});

export default router;
