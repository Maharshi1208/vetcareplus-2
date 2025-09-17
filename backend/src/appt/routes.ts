import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/db';
import { authRequired, AuthedRequest } from '../middleware/auth';
import {
  sendApptBooked,
  sendApptRescheduled,
  sendApptCancelled,
} from '../lib/mailer';

const router = Router();

/* ------------------------- helpers ------------------------- */
const isAdmin = (req: AuthedRequest) => req.user?.role === 'ADMIN';

function ensureIso(d: string) {
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) throw new Error('Invalid date');
  return dt;
}
function sameLocalDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function weekdayLocal(d: Date) {
  return d.getDay(); // 0..6
}
function minutesOfDayLocal(d: Date) {
  return d.getHours() * 60 + d.getMinutes();
}

// within vet availability?
async function withinAvailability(vetId: string, start: Date, end: Date) {
  if (!sameLocalDay(start, end)) return false; // simple rule for now
  const wd = weekdayLocal(start);
  const s = minutesOfDayLocal(start);
  const e = minutesOfDayLocal(end);
  if (!(e > s)) return false;

  const slots = await prisma.vetAvailability.findMany({
    where: { vetId, weekday: wd },
  });
  return slots.some((slot) => s >= slot.startMinutes && e <= slot.endMinutes);
}

// conflict with existing appointments?
async function apptConflict(
  vetId: string,
  start: Date,
  end: Date,
  excludeId?: string
) {
  const clash = await prisma.appointment.findFirst({
    where: {
      vetId,
      status: 'BOOKED',
      // overlap: not (newEnd <= existingStart OR newStart >= existingEnd)
      NOT: {
        OR: [{ end: { lte: start } }, { start: { gte: end } }],
      },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });
  return !!clash;
}

// owner scoping: ensure the pet belongs to the caller (unless ADMIN)
async function canUsePet(req: AuthedRequest, petId: string) {
  if (isAdmin(req)) return true;
  const pet = await prisma.pet.findUnique({
    where: { id: petId },
    select: { ownerId: true },
  });
  return !!pet && pet.ownerId === req.user!.sub;
}

/* ------------------------- validation ------------------------- */
const bookSchema = z.object({
  petId: z.string().cuid(),
  vetId: z.string().cuid(),
  start: z.string(), // ISO
  end: z.string(), // ISO
  reason: z.string().optional(),
});

const rescheduleSchema = z.object({
  start: z.string(),
  end: z.string(),
});

// pagination & (optional) filters
const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['BOOKED', 'CANCELLED', 'COMPLETED']).optional(),
});

/* ------------------------- routes ------------------------- */

// GET /appointments  (paginated)
router.get('/', authRequired, async (req: AuthedRequest, res) => {
  const { page, pageSize, status } = listQuerySchema.parse(req.query);

  const baseWhere = isAdmin(req) ? {} : { pet: { ownerId: req.user!.sub } };
  const where = status ? { ...baseWhere, status } : baseWhere;

  const [items, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      orderBy: { start: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        petId: true,
        vetId: true,
        start: true,
        end: true,
        status: true,
        reason: true,
        notes: true,
        pet: { select: { name: true, ownerId: true } },
        vet: { select: { name: true, specialty: true } },
      },
    }),
    prisma.appointment.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  res.json({
    ok: true,
    page,
    pageSize,
    total,
    totalPages,
    hasPrev: page > 1,
    hasNext: page < totalPages,
    appointments: items,
  });
});

// POST /appointments  (book)
router.post('/', authRequired, async (req: AuthedRequest, res) => {
  const parsed = bookSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ ok: false, error: parsed.error.flatten() });

  const { petId, vetId, start, end, reason } = parsed.data;
  if (!(await canUsePet(req, petId)))
    return res
      .status(403)
      .json({ ok: false, error: 'Forbidden: pet not owned' });

  let s: Date, e: Date;
  try {
    s = ensureIso(start);
    e = ensureIso(end);
  } catch {
    return res.status(400).json({ ok: false, error: 'Invalid date' });
  }
  if (!(e > s))
    return res
      .status(400)
      .json({ ok: false, error: 'End must be after start' });

  const vet = await prisma.vet.findUnique({
    where: { id: vetId },
    select: { active: true, name: true },
  });
  if (!vet || !vet.active)
    return res.status(400).json({ ok: false, error: 'Vet not found/active' });

  if (!(await withinAvailability(vetId, s, e))) {
    return res
      .status(409)
      .json({ ok: false, error: 'Outside vet availability' });
  }
  if (await apptConflict(vetId, s, e)) {
    return res
      .status(409)
      .json({ ok: false, error: 'Conflicting appointment' });
  }

  const appt = await prisma.appointment.create({
    data: { petId, vetId, start: s, end: e, status: 'BOOKED', reason },
  });

  // Fire-and-forget email
  try {
    const pet = await prisma.pet.findUnique({
      where: { id: petId },
      select: { name: true, ownerId: true },
    });
    const owner = pet
      ? await prisma.user.findUnique({
          where: { id: pet.ownerId },
          select: { email: true },
        })
      : null;

    if (owner?.email && pet?.name && vet?.name) {
      void sendApptBooked(owner.email, pet.name, vet.name, s, e);
    }
  } catch {
    /* ignore mail errors */
  }

  res.status(201).json({ ok: true, appointment: appt });
});

// PATCH /appointments/:id/reschedule
router.patch('/:id/reschedule', authRequired, async (req: AuthedRequest, res) => {
  const parsed = rescheduleSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ ok: false, error: parsed.error.flatten() });

  const appt = await prisma.appointment.findUnique({
    where: { id: req.params.id },
    select: {
      id: true,
      petId: true,
      vetId: true,
      status: true,
      pet: { select: { ownerId: true, name: true } },
      vet: { select: { name: true } },
    },
  });
  if (!appt) return res.status(404).json({ ok: false, error: 'Not found' });
  if (appt.status !== 'BOOKED')
    return res
      .status(400)
      .json({ ok: false, error: 'Only BOOKED can be rescheduled' });
  if (!isAdmin(req) && appt.pet.ownerId !== req.user!.sub)
    return res.status(403).json({ ok: false, error: 'Forbidden' });

  let s: Date, e: Date;
  try {
    s = ensureIso(parsed.data.start);
    e = ensureIso(parsed.data.end);
  } catch {
    return res.status(400).json({ ok: false, error: 'Invalid date' });
  }
  if (!(e > s))
    return res
      .status(400)
      .json({ ok: false, error: 'End must be after start' });

  if (!(await withinAvailability(appt.vetId, s, e))) {
    return res
      .status(409)
      .json({ ok: false, error: 'Outside vet availability' });
  }
  if (await apptConflict(appt.vetId, s, e, appt.id)) {
    return res
      .status(409)
      .json({ ok: false, error: 'Conflicting appointment' });
  }

  const updated = await prisma.appointment.update({
    where: { id: appt.id },
    data: { start: s, end: e },
  });

  // Fire-and-forget email
  try {
    const owner = await prisma.user.findUnique({
      where: { id: appt.pet.ownerId },
      select: { email: true },
    });
    if (owner?.email && appt.pet.name && appt.vet?.name) {
      void sendApptRescheduled(
        owner.email,
        appt.pet.name,
        appt.vet.name,
        updated.start,
        updated.end
      );
    }
  } catch {
    /* ignore mail errors */
  }

  res.json({ ok: true, appointment: updated });
});

// PATCH /appointments/:id/cancel
router.patch('/:id/cancel', authRequired, async (req: AuthedRequest, res) => {
  const appt = await prisma.appointment.findUnique({
    where: { id: req.params.id },
    select: {
      id: true,
      status: true,
      pet: { select: { ownerId: true, name: true } },
      vet: { select: { name: true } },
      start: true,
    },
  });
  if (!appt) return res.status(404).json({ ok: false, error: 'Not found' });
  if (appt.status !== 'BOOKED')
    return res
      .status(400)
      .json({ ok: false, error: 'Only BOOKED can be cancelled' });
  if (!isAdmin(req) && appt.pet.ownerId !== req.user!.sub)
    return res.status(403).json({ ok: false, error: 'Forbidden' });

  const updated = await prisma.appointment.update({
    where: { id: appt.id },
    data: { status: 'CANCELLED' },
  });

  // Fire-and-forget email
  try {
    const owner = await prisma.user.findUnique({
      where: { id: appt.pet.ownerId },
      select: { email: true },
    });
    if (owner?.email && appt.pet.name && appt.vet?.name) {
      void sendApptCancelled(
        owner.email,
        appt.pet.name,
        appt.vet.name,
        appt.start
      );
    }
  } catch {
    /* ignore mail errors */
  }

  res.json({ ok: true, appointment: { id: updated.id, status: updated.status } });
});

// PATCH /appointments/:id/complete (ADMIN only, requires a SUCCESS payment)
router.patch('/:id/complete', authRequired, async (req, res) => {
  const user = (req as any).user;
  if (!user || user.role !== 'ADMIN') {
    return res.status(403).json({ ok: false, error: 'Admin only' });
  }

  const id = req.params.id;

  const appt = await prisma.appointment.findUnique({
    where: { id },
    select: { id: true, status: true },
  });
  if (!appt) return res.status(404).json({ ok: false, error: 'Not found' });
  if (appt.status !== 'BOOKED') {
    return res
      .status(400)
      .json({ ok: false, error: 'Only BOOKED appointments can be completed' });
  }

  const paid = await prisma.payment.findFirst({
    where: { appointmentId: id, status: 'SUCCESS' },
    select: { id: true },
  });
  if (!paid) {
    return res
      .status(400)
      .json({ ok: false, error: 'Requires a successful payment' });
  }

  const updated = await prisma.appointment.update({
    where: { id },
    data: { status: 'COMPLETED' },
  });

  return res.json({ ok: true, appointment: updated });
});

export default router;
