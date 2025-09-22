// backend/src/config/env.ts
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().default(4000),
  CORS_ORIGIN: z.string().default('*'),

  DATABASE_URL: z.string(),

  JWT_SECRET: z.string().min(20, 'JWT_SECRET must be set'),

  SMTP_HOST: z.string().default(process.env.NODE_ENV === 'production' ? 'mailhog' : '127.0.0.1'),
  SMTP_PORT: z.coerce.number().default(1025),
  SMTP_SECURE: z.coerce.boolean().default(false),
  SMTP_FROM: z.string().default('no-reply@vetcare.local'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),

  // ✅ Added missing keys
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  RESET_LINK_BASE: z.string().url().default('http://localhost:5173/reset-password'),
});

export const env = schema.parse(process.env);
