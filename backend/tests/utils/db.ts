import { execSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function resetDatabase() {
  execSync('npx prisma migrate reset --force', { stdio: 'inherit' });
}
export async function disconnect() {
  await prisma.$disconnect();
}
