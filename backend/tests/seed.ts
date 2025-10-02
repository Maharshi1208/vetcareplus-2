import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
export async function seedBasic() {
  const admin = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: { email: 'admin@test.com', password: 'secret123', role: 'ADMIN', name: 'Admin' }
  });
  const owner = await prisma.owner.upsert({
    where: { email: 'owner1@test.com' },
    update: {},
    create: { name: 'Owner One', email: 'owner1@test.com', phone: '123-456-7890' }
  });
  const pet = await prisma.pet.create({ data: { name: 'Buddy', species: 'Dog', ownerId: owner.id } });
  return { admin, owner, pet };
}
if (require.main === module) seedBasic().finally(()=>prisma.$disconnect());
