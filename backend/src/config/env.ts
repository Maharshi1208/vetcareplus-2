import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development','test','production']).default('development'),
  PORT: z.coerce.number().default(4000),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  JWT_SECRET: z.string().min(20, 'JWT_SECRET must be set'),
  JWT_EXPIRES: z.string().default('1d'),

  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  MAIL_HOST: z.string().default('localhost'),
  MAIL_PORT: z.coerce.number().default(1025),
  MAIL_USER: z.string().optional(),
  MAIL_PASS: z.string().optional(),
  MAIL_FROM: z.string().default('VetCare+ <no-reply@vetcare.local>'),
});

export const env = schema.parse(process.env);
