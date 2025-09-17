import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

// 100 req / 15 min in dev, 300 in prod
const windowMs = 15 * 60 * 1000;
const max = env.NODE_ENV === 'production' ? 300 : 100;

export const rateLimiter = rateLimit({
  windowMs,
  max,
  standardHeaders: true, // RateLimit-* headers
  legacyHeaders: false,
  message: { ok: false, error: 'Too many requests, please try again later.' },
});

