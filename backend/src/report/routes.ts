import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/db';
import { authRequired, AuthedRequest } from '../middleware/auth';

const router = Router();
const isAdmin = (req: AuthedRequest) => req.user?.role === 'ADMIN';

function parseDateOnly(s: string) {
  // Treat YYYY-MM-DD as a *local* date (avoid UTC shift to previous day)
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d); // local midnight
  }
  const d2 = new Date(s);
  if (Number.isNaN(d2.getTime())) throw new Error('Invalid date');
  return d2;
}
function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

const kpiQuery = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  // optional: vaccine is due if last vax older than these days
  vaxDays: z.coerce.number().int().positive().default(365),
});

// GET /reports/kpis?from=YYYY-MM-DD&to=YYYY-MM-DD[&vaxDays=365]
// Admin only.
router.get('/kpis', authRequired, async (req: AuthedRequest, res) => {
  if (!isAdmin(req)) return res.status(403).json({ ok: false, error: 'Admin only' });

  const parsed = kpiQuery.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.flatten() });

  let from: Date, to: Date;
  try {
    from = startOfDay(parseDateOnly(parsed.data.from));
    to = endOfDay(parseDateOnly(parsed.data.to));
  } catch {
    return res.status(400).json({ ok: false, error: 'Invalid date range' });
  }
  const vaxDays = parsed.data.vaxDays;
  const dueCutoff = new Date(to.getTime() - vaxDays * 24 * 60 * 60 * 1000);

  // Bookings/cancels/completed counted by appointment start falling in range
  const [booked, cancelled, completed, revenueAgg, petCount, lastVax] = await Promise.all([
    prisma.appointment.count({ where: { start: { gte: from, lte: to }, status: 'BOOKED' } }),
    prisma.appointment.count({ where: { start: { gte: from, lte: to }, status: 'CANCELLED' } }),
    prisma.appointment.count({ where: { start: { gte: from, lte: to }, status: 'COMPLETED' } }),
    prisma.payment.aggregate({
      _sum: { amountCents: true },
      where: { status: 'SUCCESS', createdAt: { gte: from, lte: to } },
    }),
    prisma.pet.count(),
    prisma.vaccination.groupBy({
      by: ['petId'],
      _max: { givenAt: true },
    }),
  ]);

  // Compute due vaccines as of "to"
  // - Pets with no vaccination at all
  // - OR last vaccination older than vaxDays
  const lastByPet = new Map(lastVax.map(r => [r.petId, r._max.givenAt]));
  // We need all pet IDs to know who has none
  const allPets = await prisma.pet.findMany({ select: { id: true } });
  let dueVaccines = 0;
  for (const p of allPets) {
    const last = lastByPet.get(p.id);
    if (!last || last < dueCutoff) dueVaccines++;
  }

  const revenueCents = revenueAgg._sum.amountCents ?? 0;

  res.json({
    ok: true,
    range: { from, to },
    kpis: {
      bookings: booked,
      cancelled,
      completed,
      revenueCents,
      dueVaccines,
      totalPets: petCount,
      vaxDaysCutoff: vaxDays,
    },
  });
});

const schedQuery = z.object({
  date: z.string().min(1),
  format: z.enum(['json', 'csv']).optional(),
});

// GET /reports/schedule?date=YYYY-MM-DD[&format=csv]
// Admin only. Shows per-vet schedule for that day.
router.get('/schedule', authRequired, async (req: AuthedRequest, res) => {
  if (!isAdmin(req)) return res.status(403).json({ ok: false, error: 'Admin only' });

  const parsed = schedQuery.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.flatten() });

  let day: Date;
  try { day = parseDateOnly(parsed.data.date); } catch { return res.status(400).json({ ok: false, error: 'Invalid date' }); }
  const start = startOfDay(day), end = endOfDay(day);

  const appts = await prisma.appointment.findMany({
    where: { start: { gte: start, lte: end }, status: { in: ['BOOKED', 'COMPLETED'] } },
    orderBy: [{ vetId: 'asc' }, { start: 'asc' }],
    select: {
      id: true, start: true, end: true, status: true, reason: true,
      pet: { select: { name: true } },
      vet: { select: { id: true, name: true, specialty: true } },
    },
  });

  const rows = appts.map(a => ({
    vetId: a.vet.id,
    vetName: a.vet.name,
    specialty: a.vet.specialty ?? '',
    start: a.start,
    end: a.end,
    status: a.status,
    petName: a.pet.name,
    reason: a.reason ?? '',
    apptId: a.id,
  }));

  if (parsed.data.format === 'csv') {
    const header = 'vetId,vetName,specialty,start,end,status,petName,reason,appointmentId';
    const csv = [header, ...rows.map(r =>
      [r.vetId, r.vetName, r.specialty, r.start.toISOString(), r.end.toISOString(), r.status, r.petName, r.reason.replaceAll(',', ' '), r.apptId]
        .map(v => `"${String(v).replaceAll('"','""')}"`).join(',')
    )].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(csv);
  }

  res.json({ ok: true, date: start, schedule: rows });
});

export default router;
