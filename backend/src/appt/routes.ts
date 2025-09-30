// backend/src/appt/routes.ts
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/db.js';
import { authRequired, AuthedRequest } from '../middleware/auth.js';
import {
  sendApptBooked,
  sendApptRescheduled,
  sendApptCancelled,
} from '../lib/mailer.js';

// ---------- helpers ----------
const isAdmin = (req: AuthedRequest) => req.user?.role === 'ADMIN';
const isVet   = (req: AuthedRequest) => req.user?.role === 'VET';

function ensureIso(d: string) {
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) throw new Error('Invalid date');
  return dt;
}

function parseDateOnly(s: string) {
  // Treat YYYY-MM-DD as local midnight
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  const d2 = new Date(s);
  if (Number.isNaN(d2.getTime())) throw new Error('Invalid date');
  return d2;
}

function sameLocalDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function weekdayLocal(d: Date) { return d.getDay(); }              // 0..6
function minutesOfDayLocal(d: Date) { return d.getHours() * 60 + d.getMinutes(); }

/**
 * Resolve the vetId that corresponds to the logged-in user.
 * Tries email first (safe), then userId if your schema has it.
 */
async function vetIdForReq(req: AuthedRequest): Promise<string | null> {
  if (req.user?.email) {
    const byEmail = await prisma.vet.findFirst({
      where: { email: req.user.email },
      select: { id: true },
    });
    if (byEmail?.id) return byEmail.id;
  }
  try {
    const byUser = await prisma.vet.findFirst({
      where: { userId: req.user!.sub } as any,
      select: { id: true },
    });
    if (byUser?.id) return byUser.id;
  } catch {}
  return null;
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
    select: { startMinutes: true, endMinutes: true }
  });
  // ok if any slot fully contains [s,e)
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
      // overlap if NOT (end <= existing.start OR start >= existing.end)
      NOT: { OR: [{ end: { lte: start } }, { start: { gte: end } }] },
      ...(excludeId ? { id: { not: excludeId } } : {})
    },
    select: { id: true }
  });
  return !!clash;
}

// owner scoping: ensure the pet belongs to the caller (unless ADMIN)
async function canUsePet(req: AuthedRequest, petId: string) {
  if (isAdmin(req)) return true;
  const pet = await prisma.pet.findUnique({
    where: { id: petId },
    select: { ownerId: true }
  });
  return !!pet && pet.ownerId === req.user!.sub;
}

const router = Router();

// ---------- validation ----------
const bookSchema = z.object({
  petId: z.string().cuid(),
  vetId: z.string().cuid(),
  start: z.string(), // ISO
  end: z.string(),   // ISO
  reason: z.string().optional(),
});

const rescheduleSchema = z.object({
  start: z.string(),
  end: z.string(),
});

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['BOOKED', 'CANCELLED', 'COMPLETED']).optional(),
  from: z.string().optional(), // ISO or YYYY-MM-DD
  to: z.string().optional(),   // ISO or YYYY-MM-DD (exclusive)
});

// for generic status endpoint
const statusSchema = z.object({
  status: z.enum(['BOOKED', 'CANCELLED', 'COMPLETED']),
});

/** Helper to build a compact owner object from a joined pet.owner */
function buildOwnerFromPet(pet: any) {
  const u = pet?.owner;
  if (!u) return null;
  return { id: u.id, name: u.name ?? u.email ?? u.id };
}

// ---------- routes ----------

// GET /appointments (with pagination + filters)
router.get('/', authRequired, async (req: AuthedRequest, res) => {
  const { page, pageSize, status, from, to } = listQuerySchema.parse(req.query);

  // role-scoped where
  const where: any = {};
  if (isAdmin(req)) {
    // no extra filter
  } else if (isVet(req)) {
    const vid = await vetIdForReq(req);
    if (!vid) {
      return res.status(403).json({ ok: false, error: "No vet profile linked to this user" });
    }
    where.vetId = vid;
  } else {
    // OWNER
    where.pet = { ownerId: req.user!.sub };
  }

  if (status) where.status = status;
  if (from || to) {
    where.start = {};
    if (from) where.start.gte = parseDateOnly(from);
    if (to)   where.start.lt  = parseDateOnly(to);
  }

  const [items, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      orderBy: { start: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true, petId: true, vetId: true, start: true, end: true, status: true, reason: true, notes: true,
        pet: {
          select: {
            name: true,
            ownerId: true,
            // ↓↓↓ join the user so we can display a human name
            owner: { select: { id: true, name: true, email: true } },
          }
        },
        vet: { select: { name: true, specialty: true } },
      }
    }),
    prisma.appointment.count({ where })
  ]);

  // add a top-level "owner" object while preserving the rest of each row
  const withOwner = items.map((row: any) => ({
    ...row,
    owner: buildOwnerFromPet(row.pet),
  }));

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  res.json({
    ok: true,
    page, pageSize, total, totalPages,
    hasPrev: page > 1,
    hasNext: page < totalPages,
    appointments: withOwner,
  });
});

// GET /appointments/:id (scoped by role)
router.get('/:id', authRequired, async (req: AuthedRequest, res) => {
  const id = req.params.id;
  const appt = await prisma.appointment.findUnique({
    where: { id },
    select: {
      id: true, petId: true, vetId: true, start: true, end: true, status: true, reason: true, notes: true,
      pet: {
        select: {
          ownerId: true,
          name: true,
          owner: { select: { id: true, name: true, email: true } }, // ← join owner
        }
      },
      vet: { select: { name: true, specialty: true } },
      createdAt: true, updatedAt: true,
    }
  });

  if (!appt) return res.status(404).json({ ok: false, error: 'Not found' });

  if (!isAdmin(req)) {
    if (isVet(req)) {
      const vid = await vetIdForReq(req);
      if (!vid) return res.status(403).json({ ok: false, error: 'No vet profile linked to this user' });
      if (appt.vetId !== vid) return res.status(403).json({ ok: false, error: 'Forbidden' });
    } else {
      // OWNER
      if (appt.pet?.ownerId !== req.user!.sub) {
        return res.status(403).json({ ok: false, error: 'Forbidden' });
      }
    }
  }

  // include top-level owner object for convenience
  const out: any = { ...appt, owner: buildOwnerFromPet(appt.pet) };
  return res.json({ ok: true, appointment: out });
});

// POST /appointments (book)
router.post('/', authRequired, async (req: AuthedRequest, res) => {
  const parsed = bookSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  }

  const { petId, vetId, start, end, reason } = parsed.data;
  if (!(await canUsePet(req, petId))) {
    return res.status(403).json({ ok: false, error: 'Forbidden: pet not owned' });
  }

  // archived-pet guard
  const petRow = await prisma.pet.findUnique({
    where: { id: petId },
    select: { archived: true, name: true, ownerId: true }
  });
  if (!petRow) return res.status(404).json({ ok: false, error: 'Pet not found' });
  if (petRow.archived) return res.status(400).json({ ok: false, error: 'Cannot book for archived pet' });

  let s: Date, e: Date;
  try { s = ensureIso(start); e = ensureIso(end); }
  catch { return res.status(400).json({ ok: false, error: 'Invalid date' }); }
  if (!(e > s)) return res.status(400).json({ ok: false, error: 'End must be after start' });

  const vet = await prisma.vet.findUnique({
    where: { id: vetId },
    select: { active: true, name: true }
  });
  if (!vet || !vet.active) {
    return res.status(400).json({ ok: false, error: 'Vet not found/active' });
  }

  if (!(await withinAvailability(vetId, s, e))) {
    return res.status(409).json({ ok: false, error: 'Outside vet availability' });
  }
  if (await apptConflict(vetId, s, e)) {
    return res.status(409).json({ ok: false, error: 'Conflicting appointment' });
  }

  const created = await prisma.appointment.create({
    data: { petId, vetId, start: s, end: e, status: 'BOOKED', reason },
    select: {
      id: true, petId: true, vetId: true, start: true, end: true, status: true, reason: true, notes: true,
      pet: {
        select: {
          name: true,
          ownerId: true,
          owner: { select: { id: true, name: true, email: true } },
        }
      },
      vet: { select: { name: true, specialty: true } },
    }
  });

  // fire-and-forget email (swallow errors)
  try {
    const owner = await prisma.user.findUnique({
      where: { id: petRow.ownerId },
      select: { email: true },
    });
    if (owner?.email && petRow.name && vet.name) {
      void sendApptBooked(owner.email, petRow.name, vet.name, s, e);
    }
  } catch {}

  const out: any = { ...created, owner: buildOwnerFromPet(created.pet) };
  res.status(201).json({ ok: true, appointment: out });
});

// PATCH /appointments/:id/reschedule
router.patch('/:id/reschedule', authRequired, async (req: AuthedRequest, res) => {
  const parsed = rescheduleSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  }

  const appt = await prisma.appointment.findUnique({
    where: { id: req.params.id },
    select: {
      id: true, petId: true, vetId: true, status: true,
      pet: { select: { ownerId: true, name: true } },
      vet: { select: { name: true } },
    }
  });
  if (!appt) return res.status(404).json({ ok: false, error: 'Not found' });
  if (appt.status !== 'BOOKED') {
    return res.status(400).json({ ok: false, error: 'Only BOOKED can be rescheduled' });
  }

  // role-based permission: admin OR vet for their own appt OR owner of the pet
  if (!isAdmin(req)) {
    if (isVet(req)) {
      const vid = await vetIdForReq(req);
      if (!vid || appt.vetId !== vid) {
        return res.status(403).json({ ok: false, error: 'Forbidden' });
      }
    } else {
      if (appt.pet.ownerId !== req.user!.sub) {
        return res.status(403).json({ ok: false, error: 'Forbidden' });
      }
    }
  }

  let s: Date, e: Date;
  try { s = ensureIso(parsed.data.start); e = ensureIso(parsed.data.end); }
  catch { return res.status(400).json({ ok: false, error: 'Invalid date' }); }
  if (!(e > s)) return res.status(400).json({ ok: false, error: 'End must be after start' });

  if (!(await withinAvailability(appt.vetId, s, e))) {
    return res.status(409).json({ ok: false, error: 'Outside vet availability' });
  }
  if (await apptConflict(appt.vetId, s, e, appt.id)) {
    return res.status(409).json({ ok: false, error: 'Conflicting appointment' });
  }

  const updated = await prisma.appointment.update({
    where: { id: appt.id },
    data: { start: s, end: e }
  });

  try {
    const owner = await prisma.user.findUnique({
      where: { id: appt.pet.ownerId },
      select: { email: true },
    });
    if (owner?.email && appt.pet.name && appt.vet?.name) {
      void sendApptRescheduled(owner.email, appt.pet.name, appt.vet.name, updated.start, updated.end);
    }
  } catch {}

  res.json({ ok: true, appointment: updated });
});

// PATCH /appointments/:id/cancel
router.patch('/:id/cancel', authRequired, async (req: AuthedRequest, res) => {
  const appt = await prisma.appointment.findUnique({
    where: { id: req.params.id },
    select: {
      id: true, status: true, start: true, vetId: true,
      pet: { select: { ownerId: true, name: true } },
      vet: { select: { name: true } },
    }
  });
  if (!appt) return res.status(404).json({ ok: false, error: 'Not found' });
  if (appt.status !== 'BOOKED') {
    return res.status(400).json({ ok: false, error: 'Only BOOKED can be cancelled' });
  }

  // role-based permission: admin OR vet for their own appt OR owner of the pet
  if (!isAdmin(req)) {
    if (isVet(req)) {
      const vid = await vetIdForReq(req);
      if (!vid || appt.vetId !== vid) {
        return res.status(403).json({ ok: false, error: 'Forbidden' });
      }
    } else {
      if (appt.pet.ownerId !== req.user!.sub) {
        return res.status(403).json({ ok: false, error: 'Forbidden' });
      }
    }
  }

  const updated = await prisma.appointment.update({
    where: { id: appt.id },
    data: { status: 'CANCELLED' }
  });

  try {
    const owner = await prisma.user.findUnique({
      where: { id: appt.pet.ownerId },
      select: { email: true },
    });
    if (owner?.email && appt.pet.name && appt.vet?.name) {
      void sendApptCancelled(owner.email, appt.pet.name, appt.vet.name, appt.start);
    }
  } catch {}

  // keep the minimal response shape you already had (to avoid breaking anything)
  res.json({ ok: true, appointment: { id: updated.id, status: updated.status } });
});

// PATCH /appointments/:id/restore
router.patch('/:id/restore', authRequired, async (req: AuthedRequest, res) => {
  const appt = await prisma.appointment.findUnique({
    where: { id: req.params.id },
    select: {
      id: true, status: true, start: true, end: true, vetId: true,
      pet: { select: { ownerId: true, name: true } },
      vet: { select: { name: true } },
    }
  });
  if (!appt) return res.status(404).json({ ok: false, error: 'Not found' });
  if (appt.status !== 'CANCELLED') {
    return res.status(400).json({ ok: false, error: 'Only CANCELLED can be restored' });
  }
  if (!isAdmin(req) && appt.pet.ownerId !== req.user!.sub) {
    return res.status(403).json({ ok: false, error: 'Forbidden' });
  }

  const s = appt.start;
  const e = appt.end;

  if (!(await withinAvailability(appt.vetId, s, e))) {
    return res.status(409).json({ ok: false, error: 'Outside vet availability' });
  }
  if (await apptConflict(appt.vetId, s, e, appt.id)) {
    return res.status(409).json({ ok: false, error: 'Time slot no longer available' });
  }

  const updated = await prisma.appointment.update({
    where: { id: appt.id },
    data: { status: 'BOOKED' },
    select: {
      id: true, petId: true, vetId: true, start: true, end: true, status: true, reason: true, notes: true,
      pet: { select: { name: true, ownerId: true } },
      vet: { select: { name: true, specialty: true } },
    }
  });

  try {
    const owner = await prisma.user.findUnique({
      where: { id: appt.pet.ownerId },
      select: { email: true },
    });
    if (owner?.email && appt.pet.name && appt.vet?.name) {
      void sendApptBooked(owner.email, appt.pet.name, appt.vet.name, updated.start, updated.end);
    }
  } catch {}

  res.json({ ok: true, appointment: updated });
});

// POST /appointments/:id/status (fallback)
router.post('/:id/status', authRequired, async (req: AuthedRequest, res) => {
  const { status } = statusSchema.parse(req.body);

  const appt = await prisma.appointment.findUnique({
    where: { id: req.params.id },
    select: {
      id: true, status: true, start: true, end: true, vetId: true,
      pet: { select: { ownerId: true, name: true } },
      vet: { select: { name: true } },
    }
  });
  if (!appt) return res.status(404).json({ ok: false, error: 'Not found' });

  if (status === 'CANCELLED') {
    if (appt.status !== 'BOOKED') {
      return res.status(400).json({ ok: false, error: 'Only BOOKED can be cancelled' });
    }
    if (!isAdmin(req)) {
      if (isVet(req)) {
        const vid = await vetIdForReq(req);
        if (!vid || appt.vetId !== vid) {
          return res.status(403).json({ ok: false, error: 'Forbidden' });
        }
      } else {
        if (appt.pet.ownerId !== req.user!.sub) {
          return res.status(403).json({ ok: false, error: 'Forbidden' });
        }
      }
    }
    const updated = await prisma.appointment.update({
      where: { id: appt.id },
      data: { status: 'CANCELLED' },
    });
    try {
      const owner = await prisma.user.findUnique({
        where: { id: appt.pet.ownerId },
        select: { email: true },
      });
      if (owner?.email && appt.pet.name && appt.vet?.name) {
        void sendApptCancelled(owner.email, appt.pet.name, appt.vet.name, appt.start);
      }
    } catch {}
    return res.json({ ok: true, appointment: updated });
  }

  if (status === 'BOOKED') {
    if (appt.status !== 'CANCELLED') {
      return res.status(400).json({ ok: false, error: 'Only CANCELLED can be restored' });
    }
    if (!isAdmin(req) && appt.pet.ownerId !== req.user!.sub) {
      return res.status(403).json({ ok: false, error: 'Forbidden' });
    }
    const s = appt.start;
    const e = appt.end;
    if (!(await withinAvailability(appt.vetId, s, e))) {
      return res.status(409).json({ ok: false, error: 'Outside vet availability' });
    }
    if (await apptConflict(appt.vetId, s, e, appt.id)) {
      return res.status(409).json({ ok: false, error: 'Time slot no longer available' });
    }
    const updated = await prisma.appointment.update({
      where: { id: appt.id },
      data: { status: 'BOOKED' },
    });
    try {
      const owner = await prisma.user.findUnique({
        where: { id: appt.pet.ownerId },
        select: { email: true },
      });
      if (owner?.email && appt.pet.name && appt.vet?.name) {
        void sendApptBooked(owner.email, appt.pet.name, appt.vet.name, updated.start, updated.end);
      }
    } catch {}
    return res.json({ ok: true, appointment: updated });
  }

  if (status === 'COMPLETED') {
    if (!isAdmin(req)) {
      return res.status(403).json({ ok: false, error: 'Admin only' });
    }
    if (appt.status !== 'BOOKED') {
      return res.status(400).json({ ok: false, error: 'Only BOOKED appointments can be completed' });
    }
    const paid = await prisma.payment.findFirst({
      where: { appointmentId: appt.id, status: 'SUCCESS' },
      select: { id: true }
    });
    if (!paid) {
      return res.status(400).json({ ok: false, error: 'Requires a successful payment' });
    }
    const updated = await prisma.appointment.update({
      where: { id: appt.id },
      data: { status: 'COMPLETED' }
    });
    return res.json({ ok: true, appointment: updated });
  }

  return res.status(400).json({ ok: false, error: 'Unsupported status transition' });
});

// PATCH /appointments/:id/complete (ADMIN only, requires SUCCESS payment)
router.patch('/:id/complete', authRequired, async (req: AuthedRequest, res) => {
  if (!isAdmin(req)) {
    return res.status(403).json({ ok: false, error: 'Admin only' });
  }

  const id = req.params.id;
  const appt = await prisma.appointment.findUnique({
    where: { id },
    select: { id: true, status: true }
  });
  if (!appt) return res.status(404).json({ ok: false, error: 'Not found' });
  if (appt.status !== 'BOOKED') {
    return res.status(400).json({ ok: false, error: 'Only BOOKED appointments can be completed' });
  }

  const paid = await prisma.payment.findFirst({
    where: { appointmentId: id, status: 'SUCCESS' },
    select: { id: true }
  });
  if (!paid) {
    return res.status(400).json({ ok: false, error: 'Requires a successful payment' });
  }

  const updated = await prisma.appointment.update({
    where: { id },
    data: { status: 'COMPLETED' }
  });

  res.json({ ok: true, appointment: updated });
});

export default router;
