import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js'; // <= .js is required at runtime

export const rateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Too many requests, please try again later' },
});
