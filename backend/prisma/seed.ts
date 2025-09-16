import 'dotenv/config';
import { prisma } from '../src/lib/db';
import { hashPassword } from '../src/lib/hash';

async function main() {
  const email = 'admin@vetcare.local';
  const name = 'Admin';
  const password = 'admin123';

  const passwordHash = await hashPassword(password);

  const admin = await prisma.user.upsert({
    where: { email },
    update: { role: 'ADMIN', passwordHash, name },
    create: { email, name, role: 'ADMIN', passwordHash },
    select: { id: true, email: true, role: true, createdAt: true },
  });

  console.log('✅ Seeded admin:', admin);
  console.log('   Login with:', email, '/', password);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
