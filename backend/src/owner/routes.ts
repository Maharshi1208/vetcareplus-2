// backend/src/owner/routes.ts
import { Router } from 'express';
import { prisma } from '../lib/db.js';
import { authRequired, requireRole, AuthedRequest } from '../middleware/auth.js';

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
  return res.json(owners); // array shape for easy dropdowns
});

/**
 * Admin list/table
 * GET /owners -> { ok: true, owners: [...] }
 */
router.get('/', ...adminOnly, async (_req, res) => {
  const owners = await prisma.user.findMany({
    where: { role: 'OWNER' },
    orderBy: { name: 'asc' }, // use createdAt if your model has it
  });
  return res.json({ ok: true, owners });
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
