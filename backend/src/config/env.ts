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
  SMTP_FROM: z.string().email().default('no-reply@vetcare.local'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
});

export const env = schema.parse(process.env);
