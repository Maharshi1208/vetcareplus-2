import { Router } from 'express';
import { authRequired, requireRole, AuthedRequest } from '../middleware/auth.js';
import { prisma } from '../lib/db.js';

const router = Router();

/** Small helper to write an audit row */
async function writeAudit(opts: {
  actorId?: string | null;       // nullable per your schema
  action: 'USER_SUSPEND' | 'USER_UNSUSPEND';
  meta?: any;
  ip?: string | null;
  userAgent?: string | null;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: opts.actorId ?? null,           // maps to AuditLog.userId
        action: opts.action,                    // enum AuditAction
        meta: opts.meta ?? {},
        ip: opts.ip ?? null,
        userAgent: opts.userAgent ?? null,
      },
    });
  } catch (e) {
    console.error('auditLog.create error:', e);
  }
}

/** Admin ping */
router.get('/ping', authRequired, requireRole('ADMIN'), (_req, res) => {
  res.json({ ok: true, admin: true, msg: 'admin pong' });
});

/** Suspend user */
router.patch(
  '/users/:id/suspend',
  authRequired,
  requireRole('ADMIN'),
  async (req: AuthedRequest, res) => {
    const { id } = req.params;
    try {
      const user = await prisma.user.update({
        where: { id },
        data: { suspended: true },
        select: { id: true, email: true, role: true, suspended: true },
      });

      await writeAudit({
        actorId: req.user?.sub ?? null,
        action: 'USER_SUSPEND',
        meta: { targetUserId: id, email: user.email, role: user.role },
        ip: req.ip ?? null,
        userAgent: req.get('user-agent') ?? null,
      });

      return res.json({ ok: true, user });
    } catch (err: any) {
      if (err?.code === 'P2025') {
        return res.status(404).json({ ok: false, error: 'User not found' });
      }
      console.error('suspend error:', err);
      return res.status(500).json({ ok: false, error: 'Internal Server Error' });
    }
  }
);

/** Unsuspend user */
router.patch(
  '/users/:id/unsuspend',
  authRequired,
  requireRole('ADMIN'),
  async (req: AuthedRequest, res) => {
    const { id } = req.params;
    try {
      const user = await prisma.user.update({
        where: { id },
        data: { suspended: false },
        select: { id: true, email: true, role: true, suspended: true },
      });

      await writeAudit({
        actorId: req.user?.sub ?? null,
        action: 'USER_UNSUSPEND',
        meta: { targetUserId: id, email: user.email, role: user.role },
        ip: req.ip ?? null,
        userAgent: req.get('user-agent') ?? null,
      });

      return res.json({ ok: true, user });
    } catch (err: any) {
      if (err?.code === 'P2025') {
        return res.status(404).json({ ok: false, error: 'User not found' });
      }
      console.error('unsuspend error:', err);
      return res.status(500).json({ ok: false, error: 'Internal Server Error' });
    }
  }
);

/** List recent audit logs */
router.get(
  '/audit',
  authRequired,
  requireRole('ADMIN'),
  async (req: AuthedRequest, res) => {
    const take = Math.min(100, Math.max(1, Number(req.query.take) || 20));
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take,
    });
    res.json({ ok: true, logs });
  }
);

export default router;
