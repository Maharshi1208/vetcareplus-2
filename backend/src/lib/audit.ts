// src/lib/audit.ts
import type { Request } from 'express';
import type { AuditAction } from '@prisma/client';   // ✅ import enum at top level
import { prisma } from './db.js';

export async function writeAudit({
  action,
  actorId,
  targetId,                 // not a column; we stash in meta
  details,
  req,
}: {
  action: AuditAction;       // ✅ use the imported enum
  actorId?: string | null;
  targetId?: string | null;
  details?: Record<string, any>;
  req?: Request;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        userId: actorId ?? null,                 // actor stored in userId
        // Always send an object; avoids JsonNull typing differences across versions
        meta: {
          ...(details ?? {}),
          ...(targetId ? { targetUserId: targetId } : {}),
        },
        ip: req?.ip ?? null,
        userAgent: req?.get('user-agent') ?? null,
      },
    });
  } catch (e) {
    console.error('auditLog.create error:', e);
  }
}
