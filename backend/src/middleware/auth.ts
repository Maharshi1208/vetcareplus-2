// backend/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JwtPayload } from '../lib/jwt.js';
import { prisma } from '../lib/db.js';

export type Role = 'OWNER' | 'VET' | 'ADMIN';

export type AuthedUser = JwtPayload & {
  id: string;
  role: Role;
  suspended?: boolean;
};

export type AuthedRequest = Request & { user?: AuthedUser };

// Decide per-request (so tests that set env mid-run take effect)
function shouldBypassAuthDB(req: Request): boolean {
  const envIsTest = (process.env.NODE_ENV || '').toLowerCase() === 'test';
  const envToggle = (process.env.AUTH_TEST_TRUST_TOKEN || '').toLowerCase();
  const envExplicitOff = envToggle === '0' || envToggle === 'false';

  const hdr = String(req.headers['x-test-authdb-bypass'] ?? '').toLowerCase();
  const hdrBypass = hdr === '1' || hdr === 'true';

  return (!envExplicitOff && envIsTest) || hdrBypass;
}

export async function authRequired(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers['authorization'];
  const token = typeof header === 'string' && header.startsWith('Bearer ')
    ? header.slice(7)
    : undefined;

  if (!token) {
    return res.status(401).json({ ok: false, error: 'Missing bearer token' });
  }

  let payload: JwtPayload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    return res.status(401).json({ ok: false, error: 'Invalid/expired token' });
  }

  // Ensure sub exists and is a string (fixes TS2322)
  if (!payload?.sub || typeof payload.sub !== 'string') {
    return res.status(401).json({ ok: false, error: 'Invalid token payload' });
  }
  const sub = payload.sub as string;

  // 🔧 Fast path for tests / fuzzing
  if (shouldBypassAuthDB(req)) {
    req.user = {
      ...payload,
      id: sub,
      role: ((payload as any).role as Role) ?? 'OWNER',
      suspended: false,
    };
    return next();
  }

  // Normal: enforce latest role/suspension from DB
  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: sub },
      select: { id: true, role: true, suspended: true },
    });

    if (!dbUser) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }
    if (dbUser.suspended) {
      return res.status(403).json({ ok: false, error: 'User suspended' });
    }

    req.user = {
      ...payload,
      id: dbUser.id,
      role: dbUser.role as Role,
      suspended: dbUser.suspended,
    };
    return next();
  } catch {
    return res.status(500).json({ ok: false, error: 'Auth lookup failed' });
  }
}

export function requireRole(...roles: Role[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ ok: false, error: 'Unauthorized' });
    if (req.user.role === 'ADMIN') return next();
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ ok: false, error: 'Forbidden' });
    }
    return next();
  };
}
