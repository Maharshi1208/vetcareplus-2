// backend/src/config/env.ts
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),

  CORS_ORIGIN: z.string().url(),
  DATABASE_URL: z.string().min(1),

  // Auth
  JWT_SECRET: z.string().min(20, 'JWT_SECRET must be at least 20 characters'),
  JWT_EXPIRES: z.string().default('1d'),

  // Mail / SMTP
  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.coerce.number().int().default(1025),
  SMTP_SECURE: z.coerce.boolean().default(false), // STARTTLS off by default for MailHog
  SMTP_FROM: z.string().email(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),

  // Frontend/reset links (optional; we fall back to CORS_ORIGIN in code)
  FRONTEND_URL: z.string().url().optional(),
  RESET_LINK_BASE: z.string().url().optional(),
});

export const env = schema.parse(process.env);
export type Env = z.infer<typeof schema>;
