import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/db';

const router = Router();

function parseDateOnly(s: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  const d2 = new Date(s);
  if (Number.isNaN(d2.getTime())) throw new Error('Invalid date');
  return d2;
}
function endOfDayLocal(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
}
function monthRangeLocal(ref = new Date()) {
  const from = new Date(ref.getFullYear(), ref.getMonth(), 1);
  const to   = new Date(ref.getFullYear(), ref.getMonth() + 1, 1);
  return { from, to };
}
function csvLine(fields: (string | number | null | undefined)[]) {
  return fields
    .map((v) => {
      const s = v == null ? '' : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    })
    .join(',');
}

/* ========== SCHEDULE (JSON) ========== */
// GET /reports/schedule?date=YYYY-MM-DD
router.get('/schedule', async (req, res) => {
  const dateStr = String(req.query.date ?? '');
  if (!dateStr) return res.status(400).json({ ok: false, error: 'date is required (YYYY-MM-DD)' });

  let day: Date;
  try { day = parseDateOnly(dateStr); } catch { return res.status(400).json({ ok: false, error: 'Invalid date' }); }
  const dayEnd = endOfDayLocal(day);

  const rows = await prisma.appointment.findMany({
    where: { start: { gte: day }, end: { lte: dayEnd } },
    orderBy: [{ vetId: 'asc' }, { start: 'asc' }],
    select: {
      id: true, start: true, end: true, status: true, reason: true,
      pet: { select: { name: true } },
      vet: { select: { name: true, specialty: true } },
    },
  });

  const schedule = rows.map(r => ({
    id: r.id,
    start: r.start,
    end: r.end,
    pet: r.pet.name,
    vet: r.vet.name,
    specialty: r.vet.specialty,
    status: r.status,
    reason: r.reason ?? null,
  }));

  res.json({ ok: true, date: day.toISOString(), schedule });
});

/* ========== SCHEDULE (CSV) ========== */
// GET /reports/schedule.csv?date=YYYY-MM-DD
router.get('/schedule.csv', async (req, res) => {
  const dateStr = String(req.query.date ?? '');
  if (!dateStr) return res.status(400).send('date is required');
  let day: Date; try { day = parseDateOnly(dateStr); } catch { return res.status(400).send('invalid date'); }
  const dayEnd = endOfDayLocal(day);

  const rows = await prisma.appointment.findMany({
    where: { start: { gte: day }, end: { lte: dayEnd } },
    orderBy: [{ vetId: 'asc' }, { start: 'asc' }],
    select: {
      start: true, end: true, status: true, reason: true,
      pet: { select: { name: true } },
      vet: { select: { name: true, specialty: true } },
    },
  });

  const header = ['Date','Start','End','Vet','Specialty','Pet','Status','Reason'];
  const body = rows.map(r => [
    day.toISOString().slice(0,10),
    r.start.toISOString(),
    r.end.toISOString(),
    r.vet.name,
    r.vet.specialty ?? '',
    r.pet.name,
    r.status,
    r.reason ?? '',
  ]);

  const lines = [csvLine(header), ...body.map(csvLine)].join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="schedule-${dateStr}.csv"`);
  res.send(lines);
});

/* ========== KPIs (JSON) ========== */
// GET /reports/kpis?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/kpis', async (req, res) => {
  const now = new Date();
  let from = req.query.from ? parseDateOnly(String(req.query.from)) : monthRangeLocal(now).from;
  let to   = req.query.to   ? parseDateOnly(String(req.query.to))   : monthRangeLocal(now).to;

  if (!(to > from)) return res.status(400).json({ ok: false, error: 'to must be after from' });

  const [booked, cancelled, completed, revenueCents, totalPets, dueVaccines] = await Promise.all([
    prisma.appointment.count({ where: { start: { gte: from, lt: to }, status: 'BOOKED' } }),
    prisma.appointment.count({ where: { start: { gte: from, lt: to }, status: 'CANCELLED' } }),
    prisma.appointment.count({ where: { start: { gte: from, lt: to }, status: 'COMPLETED' } }),
    prisma.payment.aggregate({
      _sum: { amountCents: true },
      where: { status: 'SUCCESS', createdAt: { gte: from, lt: to } },
    }),
    prisma.pet.count(),
    // “dueVaccines”: naive example—vaccinations older than 365 days
    prisma.vaccination.count({
      where: { createdAt: { lt: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) } },
    }),
  ]);

  res.json({
    ok: true,
    range: { from, to },
    kpis: {
      bookings: booked,
      cancelled,
      completed,
      revenueCents: revenueCents._sum.amountCents ?? 0,
      dueVaccines,
      totalPets,
      vaxDaysCutoff: 365,
    },
  });
});

/* ========== KPIs (CSV) ========== */
// GET /reports/kpis.csv?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/kpis.csv', async (req, res) => {
  const now = new Date();
  let from = req.query.from ? parseDateOnly(String(req.query.from)) : monthRangeLocal(now).from;
  let to   = req.query.to   ? parseDateOnly(String(req.query.to))   : monthRangeLocal(now).to;

  if (!(to > from)) return res.status(400).send('to must be after from');

  const [booked, cancelled, completed, revenueCents, totalPets, dueVaccines] = await Promise.all([
    prisma.appointment.count({ where: { start: { gte: from, lt: to }, status: 'BOOKED' } }),
    prisma.appointment.count({ where: { start: { gte: from, lt: to }, status: 'CANCELLED' } }),
    prisma.appointment.count({ where: { start: { gte: from, lt: to }, status: 'COMPLETED' } }),
    prisma.payment.aggregate({
      _sum: { amountCents: true },
      where: { status: 'SUCCESS', createdAt: { gte: from, lt: to } },
    }),
    prisma.pet.count(),
    prisma.vaccination.count({
      where: { createdAt: { lt: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) } },
    }),
  ]);
  const rev = revenueCents._sum.amountCents ?? 0;

  const header = ['From','To','Bookings','Cancelled','Completed','RevenueCents','TotalPets','DueVaccines'];
  const row = [from.toISOString(), to.toISOString(), booked, cancelled, completed, rev, totalPets, dueVaccines];

  const lines = [csvLine(header), csvLine(row)].join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="kpis-${from.toISOString().slice(0,10)}_${to.toISOString().slice(0,10)}.csv"`);
  res.send(lines);
});

export default router;
