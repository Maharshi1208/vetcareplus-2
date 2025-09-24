// backend/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JwtPayload } from '../lib/jwt.js';
import { prisma } from '../lib/db.js';

export type Role = 'OWNER' | 'VET' | 'ADMIN';

// What we'll actually attach to req.user (DB-trusted role)
export type AuthedUser = JwtPayload & {
  id: string;
  role: Role;
  suspended?: boolean;
};

export type AuthedRequest = Request & { user?: AuthedUser };

export async function authRequired(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers['authorization'];
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;

  if (!token) {
    return res.status(401).json({ ok: false, error: 'Missing bearer token' });
  }

  try {
    const payload = verifyAccessToken(token); // expects { sub, role?, ... }

    // Always load from DB to enforce up-to-date role/suspension
    const dbUser = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true, suspended: true },
    });

    if (!dbUser) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }
    if (dbUser.suspended) {
      return res.status(403).json({ ok: false, error: 'User suspended' });
    }

    // Attach a trusted copy: override role from DB (not from token)
    req.user = {
      ...payload,
      id: dbUser.id,
      role: dbUser.role as Role,
      suspended: dbUser.suspended,
    };

    return next();
  } catch (err) {
    console.error('authRequired error:', err);
    return res.status(401).json({ ok: false, error: 'Invalid/expired token' });
  }
}

export function requireRole(...roles: Role[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }
    // 🔓 Superuser: ADMIN can access everything
    if (req.user.role === 'ADMIN') {
      return next();
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ ok: false, error: 'Forbidden' });
    }
    return next();
  };
}
