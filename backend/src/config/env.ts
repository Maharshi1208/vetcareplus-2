// backend/src/config/env.ts
import { z } from "zod";

/**
 * Provide sane defaults for local/dev so the app doesn't crash
 * if .env isn't loaded early enough or a key is missing.
 */
const schema = z.object({
  NODE_ENV: z.enum(["production", "development", "test"]).default("development"),

  // Server
  PORT: z.coerce.number().int().positive().default(4000),

  // CORS / URLs
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  APP_URL: z.string().default("http://localhost:4000"),
  FRONTEND_URL: z.string().default("http://localhost:5173"),
  RESET_LINK_BASE: z.string().optional(),

  // Database (matches your local Docker compose)
  DATABASE_URL: z
    .string()
    .default(
      "postgresql://vc_user:vc_pass@127.0.0.1:5433/vetcare_db?schema=public"
    ),

  // Auth
  JWT_SECRET: z
    .string()
    .default("dev_super_secret_change_me_but_long_enough_please"),
  JWT_EXPIRES: z.string().default("1d"),
  BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(10),

  // SMTP / Mail (MailHog defaults)
  SMTP_HOST: z.string().default("mailhog"), // use "127.0.0.1" if not in Docker
  SMTP_PORT: z.coerce.number().int().default(1025),
  SMTP_SECURE: z.coerce.boolean().default(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default("no-reply@vetcare.local"),
});

export const env = schema.parse(process.env);
