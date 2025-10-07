// backend/src/middleware/rateLimit.ts
import rateLimit from 'express-rate-limit';
import type { Request, Response, NextFunction } from 'express';

// Keep your existing config
const baseLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Too many requests, please try again later' },
});

/**
 * Test-friendly wrapper:
 * - Bypasses when NODE_ENV === 'test'
 * - Or when client sends X-Test-Bypass: 1 (handy for Schemathesis)
 */
export function rateLimiter(req: Request, res: Response, next: NextFunction) {
  if (process.env.NODE_ENV === 'test' || req.headers['x-test-bypass'] === '1') {
    return next();
  }
  return (baseLimiter as unknown as (r: Request, s: Response, n: NextFunction) => void)(req, res, next);
}
