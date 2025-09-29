// src/auth/mw.ts
import type { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';

export type Role = 'ADMIN' | 'OWNER' | 'VET';

interface JwtClaims {
  sub: string;        // user id
  role: Role;
  iat?: number;
  exp?: number;
}

// augment Express.Request to carry user info
declare module 'express-serve-static-core' {
  interface Request {
    user?: { id: string; role: Role };
  }
}

export function authMiddleware(allowed: Role[] = ['ADMIN','OWNER','VET']) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const header = req.headers.authorization || '';
      const token = header.startsWith('Bearer ') ? header.slice(7) : '';
      if (!token) return res.status(401).json({ ok: false, error: 'Missing token' });

      const secret = process.env.JWT_SECRET;
      if (!secret) return res.status(500).json({ ok: false, error: 'JWT secret not set' });

      const claims = jwt.verify(token, secret) as JwtClaims;
      if (!claims?.sub || !claims?.role) {
        return res.status(401).json({ ok: false, error: 'Invalid token' });
      }
      if (!allowed.includes(claims.role)) {
        return res.status(403).json({ ok: false, error: 'Forbidden' });
      }

      req.user = { id: claims.sub, role: claims.role };
      next();
    } catch (e) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }
  };
}

// --- Helpers (non-breaking) ---

// Any authenticated user
export const requireAuth: RequestHandler = authMiddleware(['ADMIN','OWNER','VET']);

// Only specified roles
export const requireRole = (...roles: Role[]): RequestHandler => authMiddleware(roles);

// Allow if resource owner === current user OR user has one of the roles
export const requireSelfOrRole =
  (getOwnerId: (req: Request) => string | undefined, ...roles: Role[]): RequestHandler =>
  (req, res, next) => {
    if (!req.user) return res.status(401).json({ ok: false, error: 'Unauthenticated' });
    const isSelf = getOwnerId(req) === req.user.id;
    if (isSelf || roles.includes(req.user.role)) return next();
    return res.status(403).json({ ok: false, error: 'Forbidden' });
  };
