// backend/scripts/create-vet.ts
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/db";

async function main() {
  const email = process.env.SEED_VET_EMAIL || "vet@vetcare.local";
  const password = process.env.SEED_VET_PASSWORD || "vet123";
  const name = process.env.SEED_VET_NAME || "Dr. Demo Vet";
  const phone = process.env.SEED_VET_PHONE || "555-2222";
  const specialty = process.env.SEED_VET_SPECIALTY || "General Practice";
  const bio = process.env.SEED_VET_BIO || "Primary care veterinarian";
  const active = true;

  const hash = await bcrypt.hash(password, 10);

  // 1) Upsert a User with role=VET
  const user = await prisma.user.upsert({
    where: { email },
    update: { role: "VET", passwordHash: hash, name },
    create: { email, passwordHash: hash, role: "VET", name },
    select: { id: true, email: true, role: true },
  });

  // 2) Ensure a Vet profile exists (by email)
  // If your Vet model links to userId in your schema, switch to where:{ userId:user.id } and create:{ userId:user.id, ... }
  const vet = await prisma.vet.upsert({
    where: { email }, // assumes Vet.email is unique
    update: { name, phone, specialty, bio, active },
    create: { name, email, phone, specialty, bio, active },
    select: { id: true, name: true, email: true, active: true },
  });

  console.log("✅ Vet account ready. Use these to log in:");
  console.log({ email, password, user, vet });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
