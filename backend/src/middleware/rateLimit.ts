// backend/src/middleware/rateLimit.ts
import rateLimit from 'express-rate-limit';
import type { Request, Response, NextFunction } from 'express';

const baseLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Too many requests, please try again later' },
});

function shouldBypass(req: Request): boolean {
  const envIsTest = (process.env.NODE_ENV || '').toLowerCase() === 'test';
  const hdr = String(req.headers['x-test-bypass'] ?? '').toLowerCase();
  const hdrBypass = hdr === '1' || hdr === 'true';
  return envIsTest || hdrBypass;
}

/** Wrapper that can be bypassed in tests or via X-Test-Bypass: 1 */
export function rateLimiter(req: Request, res: Response, next: NextFunction) {
  if (shouldBypass(req)) {
    // Return the result of next() so tests can assert `true`
    // if their stubbed next() returns true.
    // (Normal Express ignores this return value.)
    // eslint-disable-next-line @typescript-eslint/return-await
    return next();
  }
  return (baseLimiter as unknown as (r: Request, s: Response, n: NextFunction) => void)(req, res, next);
}
