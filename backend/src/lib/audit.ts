// backend/src/lib/audit.ts
import type { Request } from 'express';
import { prisma } from './db.js';

/**
 * Keep this file compatible with a wide range of Prisma versions:
 * - Don't use Prisma.InputJsonValue / Prisma.NullTypes / Prisma.$Enums
 * - Don't import the AuditAction TS type; accept string and cast at the call site
 */
export async function writeAudit({
  action,          // e.g. 'LOGIN_SUCCESS', 'USER_SUSPEND'
  actorId,         // who performed the action (user id) – optional
  targetId,        // optional, not stored directly (put it in details if needed)
  details,         // arbitrary JSON metadata
  req,             // to capture ip and user-agent
}: {
  action: string;
  actorId?: string | null;
  targetId?: string | null;
  details?: Record<string, any>;
  req?: Request;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        action: action as any,          // DB enforces enum at runtime
        userId: actorId ?? null,
        // For maximum Prisma compatibility: if no details, omit the field
        meta: details ?? undefined,     // optional JSON column
        ip: req?.ip ?? null,
        userAgent: req?.get('user-agent') ?? null,
      },
    });
  } catch (e) {
    console.error('auditLog.create error:', e);
  }
}
