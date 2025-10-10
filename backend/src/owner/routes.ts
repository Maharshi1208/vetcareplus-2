// backend/src/owner/routes.ts
import { Router } from 'express';
import { prisma } from '../lib/db.js';
import { authRequired, requireRole, AuthedRequest } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';

const router = Router();
const adminOnly = [authRequired, requireRole('ADMIN')] as const;

/**
 * Dropdown endpoint (ARRAY) for selects
 * GET /owners/select -> [{ id, name, email }]
 * Any authenticated role can call this.
 */
router.get('/select', authRequired, async (_req, res) => {
  const owners = await prisma.user.findMany({
    where: { role: 'OWNER' },
    select: { id: true, name: true, email: true },
    orderBy: { name: 'asc' },
  });
  res.setHeader('X-Total-Count', String(owners.length));
  return res.json(owners);
});

/**
 * Admin list/table
 * GET /owners -> { ok: true, owners: [...] }
 */
router.get('/', ...adminOnly, async (_req, res) => {
  const owners = await prisma.user.findMany({
    where: { role: 'OWNER' },
    orderBy: { name: 'asc' },
  });
  return res.json({ ok: true, owners });
});

/**
 * Admin create owner (also creates a login)
 * POST /owners  body: { name, email, password? }
 * If password omitted, default is "Owner!123"
 *
 * NOTE: Your User model does NOT have phone/address/notes,
 * so we do not attempt to write those fields here.
 */
router.post('/', ...adminOnly, async (req, res) => {
  try {
    const { name, email, password } = req.body ?? {};
    if (!name || !email) {
      return res.status(400).json({ ok: false, error: 'name and email are required' });
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return res.status(409).json({ ok: false, error: 'Email already registered' });
    }

    const hashed = await bcrypt.hash(password ?? 'Owner!123', 10);

    // Only fields that exist on your User model
    const owner = await prisma.user.create({
      data: {
        name,
        email,
        role: 'OWNER',
        passwordHash: hashed, // your schema has passwordHash
        suspended: false,
      },
    });

    return res.status(201).json({ ok: true, owner });
  } catch (e: any) {
    // Prisma duplicate email guard (just in case)
    if (e?.code === 'P2002' && e?.meta?.target?.includes('email')) {
      return res.status(409).json({ ok: false, error: 'Email already registered' });
    }
    console.error('POST /owners error:', e);
    return res.status(500).json({ ok: false, error: 'Internal Server Error' });
  }
});

/**
 * Admin delete owner
 * DELETE /owners/:id
 * Note: if you have FK constraints (pets/appointments),
 * either add ON DELETE CASCADE in schema or guard here.
 */
router.delete('/:id', ...adminOnly, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.user.delete({ where: { id } });
    return res.status(204).end();
  } catch (e: any) {
    if (e.code === 'P2025') return res.status(404).json({ ok: false, error: 'Owner not found' });
    if (e.code === 'P2003') return res.status(409).json({ ok: false, error: 'Owner has related records; delete or reassign first' });
    return res.status(500).json({ ok: false, error: 'Failed to delete owner' });
  }
});

/**
 * Self profile
 * GET /owners/me -> { ok: true, me: {...} }
 */
router.get('/me', authRequired, async (req: AuthedRequest, res) => {
  const me = await prisma.user.findUnique({
    where: { id: req.user!.sub },
    select: { id: true, name: true, email: true, role: true },
  });
  if (!me) return res.status(404).json({ ok: false, error: 'Not found' });
  return res.json({ ok: true, me });
});

export default router;
