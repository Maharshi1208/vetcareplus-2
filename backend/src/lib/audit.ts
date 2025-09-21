// src/lib/audit.ts
import { prisma } from './db.js';

export type AuditAction =
  | 'USER_SUSPEND'
  | 'USER_UNSUSPEND'
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILURE'
  | 'APPT_CREATE'
  | 'APPT_COMPLETE'
  | 'PAY_CHECKOUT'
  | 'PET_CREATE'
  | 'VET_CREATE'
  | 'VET_AVAILABILITY_SET';

export async function auditLog(opts: {
  actorId?: string | null;
  actorRole?: 'ADMIN' | 'OWNER' | null;
  action: AuditAction;
  target?: string | null;        // e.g. "user:123", "appointment:abc"
  ip?: string | null;
  ua?: string | null;
  meta?: Record<string, any> | null;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: opts.actorId ?? null,
        actorRole: opts.actorRole ?? null,
        action: opts.action,
        target: opts.target ?? null,
        ip: opts.ip ?? null,
        ua: opts.ua ?? null,
        meta: opts.meta ?? null,
      },
    });
  } catch (e) {
    // don't crash app if audit write fails
    console.error('auditLog error:', e);
  }
}
