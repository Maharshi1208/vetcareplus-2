import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JwtPayload } from '../lib/jwt.js';

export type AuthedRequest = Request & { user?: JwtPayload };

export function authRequired(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers['authorization'];
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
  if (!token) return res.status(401).json({ ok: false, error: 'Missing bearer token' });
  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ ok: false, error: 'Invalid/expired token' });
  }
}

export function requireRole(...roles: Array<'OWNER'|'VET'|'ADMIN'>) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ ok: false, error: 'Unauthorized' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ ok: false, error: 'Forbidden' });
    next();
  };
}
