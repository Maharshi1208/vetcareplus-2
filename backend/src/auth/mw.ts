// src/auth/mw.ts
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

type Role = 'ADMIN' | 'OWNER' | 'VET';

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
