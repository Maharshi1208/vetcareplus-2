import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JwtPayload } from '../lib/jwt.js';
import { prisma } from '../lib/db.js';

export type AuthedRequest = Request & { user?: JwtPayload & { id: string; suspended?: boolean } };

export async function authRequired(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers['authorization'];
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
  if (!token) {
    return res.status(401).json({ ok: false, error: 'Missing bearer token' });
  }

  try {
    const payload = verifyAccessToken(token);

    // Load user from DB to check suspension
    const dbUser = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, suspended: true },
    });

    if (!dbUser) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }
    if (dbUser.suspended) {
      return res.status(403).json({ ok: false, error: 'User suspended' });
    }

    // Attach trusted copy of user
    req.user = { ...payload, id: dbUser.id, suspended: dbUser.suspended };
    next();
  } catch (err) {
    console.error('authRequired error:', err);
    return res.status(401).json({ ok: false, error: 'Invalid/expired token' });
  }
}

export function requireRole(...roles: Array<'OWNER' | 'VET' | 'ADMIN'>) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ ok: false, error: 'Forbidden' });
    }
    next();
  };
}
