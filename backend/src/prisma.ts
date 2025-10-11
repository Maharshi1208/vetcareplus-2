// backend/src/prisma.ts
import { PrismaClient } from "@prisma/client";

// Single declaration
export const prisma = new PrismaClient();

// Eager connect in dev/test so /health/db doesn't 500 on first call
if (process.env.NODE_ENV !== "production") {
  prisma.$connect().catch((err) => {
    console.error("Prisma connect error:", err?.message || err);
  });
}

// Graceful shutdown
process.on("beforeExit", async () => {
  try {
    await prisma.$disconnect();
  } catch {}
});

// Also provide a default export (but do NOT re-export `{ prisma }` again)
export default prisma;
