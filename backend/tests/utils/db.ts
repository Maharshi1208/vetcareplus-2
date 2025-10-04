// tests/utils/db.ts
import { execSync } from 'node:child_process';
import { prisma } from '../../src/lib/db.js';
import { config as loadEnv } from 'dotenv';

// Load envs here too (important for the Prisma CLI)
loadEnv({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env' });

export async function resetDatabase() {
  execSync('npx prisma migrate reset --force', {
    stdio: 'inherit',
    env: { ...process.env }, // <- passes DATABASE_URL from .env.test
  });
}

export async function disconnect() {
  await prisma.$disconnect();
}
