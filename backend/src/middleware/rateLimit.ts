// backend/src/middleware/rateLimit.ts
import rateLimit, { type RateLimitRequestHandler } from 'express-rate-limit';
import type { Request } from 'express';

/** header helper: allow '1' or 'true' (case-insensitive) */
function headerTruth(req: Request, name: string): boolean {
  const v = req.header(name);
  return v === '1' || v?.toLowerCase() === 'true';
}

/**
 * Limit:
 * - Prod default: 100/min
 * - Test default: 25/min (so hammer tests hit 429 faster)
 * - Overridable via RATE_LIMIT_LIMIT env
 */
const limit =
  Number(process.env.RATE_LIMIT_LIMIT) ||
  (process.env.NODE_ENV === 'test' ? 25 : 100);

/**
 * Bypass only when an explicit header is set (e.g., by Schemathesis):
 *   X-Test-Bypass: 1
 * We do NOT auto-bypass for NODE_ENV=test so that rate-limit tests can assert 429.
 */
export const rateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60_000,
  limit,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Too many requests, please try again later' },
  skip: (req) => headerTruth(req, 'X-Test-Bypass'),
});
