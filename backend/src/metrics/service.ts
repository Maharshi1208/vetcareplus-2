// src/metrics/service.ts
import { prisma } from '../lib/db.js';
import { startOfDay, subDays, eachDayOfInterval, startOfMonth } from 'date-fns';

export async function getSummary() {
  const now = new Date();
  const monthStart = startOfMonth(now);

  const [totalPets, activeOwners, upcoming7, revenueMtd] = await Promise.all([
    prisma.pet.count(),
    prisma.user.count({ where: { role: 'OWNER', suspended: false } }),
    prisma.appointment.count({
      where: { start: { gte: now, lt: new Date(now.getTime() + 7 * 24 * 3600 * 1000) } }
    }),
    prisma.payment.aggregate({
      _sum: { amountCents: true },
      where: { status: 'SUCCESS', createdAt: { gte: monthStart } }
    }),
  ]);

  return {
    totalPets,
    activeOwners,
    upcoming7,
    // cents → dollars (or keep cents if you prefer)
    revenueMtd: (revenueMtd._sum.amountCents ?? 0)
  };
}

export async function getApptsLastNDays(days = 7) {
  const end = startOfDay(new Date());
  const start = subDays(end, days - 1);

  // zero-filled buckets for the chart
  const buckets = eachDayOfInterval({ start, end }).map(d => ({
    date: d.toISOString().slice(0, 10),
    count: 0,
  }));

  // Group by day on Appointment.start
  const rows = await prisma.$queryRaw<
    { d: string; c: string | number }[]
  >`SELECT to_char("start",'YYYY-MM-DD') AS d, COUNT(*) AS c
     FROM "Appointment"
     WHERE "start" >= ${start} AND "start" < ${new Date(end.getTime() + 86400000)}
     GROUP BY 1
     ORDER BY 1`;

  const map = new Map(buckets.map(b => [b.date, b]));
  for (const r of rows) {
    if (map.has(r.d)) map.get(r.d)!.count = Number(r.c);
  }
  return Array.from(map.values());
}

export async function getTodayScheduleByVet() {
  const dayStart = startOfDay(new Date());
  const dayEnd = new Date(dayStart.getTime() + 24 * 3600 * 1000);

  return prisma.appointment.findMany({
    where: { start: { gte: dayStart, lt: dayEnd } },
    include: { vet: true, pet: true },
    orderBy: { start: 'asc' },
  });
}

export async function getRecentActivity(limit = 10) {
  return prisma.auditLog.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
  });
}
