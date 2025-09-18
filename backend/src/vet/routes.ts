import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/db.js';
import { authRequired, AuthedRequest, requireRole } from '../middleware/auth.js';
import { hhmmToMinutes } from '../lib/time.js';

const router = Router();
const adminOnly = [authRequired, requireRole('ADMIN')] as const;

// ---- Schemas ----
const vetCreateSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  specialty: z.string().optional(),
  bio: z.string().optional(),
});

const vetUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  specialty: z.string().optional(),
  bio: z.string().optional(),
  active: z.boolean().optional(),
});

const availabilityCreateSchema = z.object({
  weekday: z.number().int().min(0).max(6),
  start: z.string(), // "HH:MM"
  end: z.string(),   // "HH:MM"
});
const availabilityUpdateSchema = z.object({
  weekday: z.number().int().min(0).max(6).optional(),
  start: z.string().optional(),
  end: z.string().optional(),
});

// ---- Helpers ----
function toRange(startHHMM: string, endHHMM: string) {
  const start = hhmmToMinutes(startHHMM);
  const end = hhmmToMinutes(endHHMM);
  if (!(start >= 0 && start < 1440 && end > 0 && end <= 1440 && end > start)) {
    throw new Error('Invalid time range');
  }
  return { start, end };
}

async function hasConflict(vetId: string, weekday: number, start: number, end: number, excludeId?: string) {
  // Overlap if not (newEnd <= existingStart OR newStart >= existingEnd)
  const conflicts = await prisma.vetAvailability.findFirst({
    where: {
      vetId, weekday,
      NOT: {
        OR: [
          { endMinutes: { lte: start } },
          { startMinutes: { gte: end } }
        ]
      },
      ...(excludeId ? { id: { not: excludeId } } : {})
    },
    select: { id: true }
  });
  return !!conflicts;
}

// ---- Vet profile CRUD (ADMIN) ----
router.get('/', ...adminOnly, async (_req, res) => {
  const vets = await prisma.vet.findMany({
    orderBy: { createdAt: 'desc' }
  });
  res.json({ ok: true, vets });
});

router.post('/', ...adminOnly, async (req, res) => {
  const parsed = vetCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.flatten() });

  try {
    const vet = await prisma.vet.create({ data: parsed.data });
    res.status(201).json({ ok: true, vet });
  } catch (e: any) {
    if (e?.code === 'P2002') return res.status(409).json({ ok: false, error: 'Email already in use' });
    throw e;
  }
});

router.get('/:id', ...adminOnly, async (req, res) => {
  const vet = await prisma.vet.findUnique({ where: { id: req.params.id } });
  if (!vet) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, vet });
});

router.patch('/:id', ...adminOnly, async (req, res) => {
  const parsed = vetUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.flatten() });

  try {
    const vet = await prisma.vet.update({ where: { id: req.params.id }, data: parsed.data });
    res.json({ ok: true, vet });
  } catch {
    return res.status(404).json({ ok: false, error: 'Not found' });
  }
});

// Soft delete: active=false
router.delete('/:id', ...adminOnly, async (req, res) => {
  try {
    const vet = await prisma.vet.update({ where: { id: req.params.id }, data: { active: false } });
    res.json({ ok: true, vet: { id: vet.id, active: vet.active } });
  } catch {
    return res.status(404).json({ ok: false, error: 'Not found' });
  }
});

// ---- Availability (ADMIN) ----
router.get('/:id/availability', ...adminOnly, async (req, res) => {
  const items = await prisma.vetAvailability.findMany({
    where: { vetId: req.params.id },
    orderBy: [{ weekday: 'asc' }, { startMinutes: 'asc' }]
  });
  res.json({ ok: true, availability: items });
});

router.post('/:id/availability', ...adminOnly, async (req, res) => {
  const parsed = availabilityCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.flatten() });

  const { weekday, start, end } = parsed.data;
  try {
    const { start: s, end: e } = toRange(start, end);
    if (await hasConflict(req.params.id, weekday, s, e)) {
      return res.status(409).json({ ok: false, error: 'Conflicting availability' });
    }
    const slot = await prisma.vetAvailability.create({
      data: { vetId: req.params.id, weekday, startMinutes: s, endMinutes: e }
    });
    res.status(201).json({ ok: true, slot });
  } catch (err: any) {
    return res.status(400).json({ ok: false, error: err.message ?? 'Bad request' });
  }
});

router.patch('/:id/availability/:slotId', ...adminOnly, async (req, res) => {
  const parsed = availabilityUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.flatten() });

  const slot = await prisma.vetAvailability.findUnique({ where: { id: req.params.slotId } });
  if (!slot || slot.vetId !== req.params.id) return res.status(404).json({ ok: false, error: 'Not found' });

  const weekday = parsed.data.weekday ?? slot.weekday;
  const s = parsed.data.start ? hhmmToMinutes(parsed.data.start) : slot.startMinutes;
  const e = parsed.data.end ? hhmmToMinutes(parsed.data.end) : slot.endMinutes;
  if (!(s >= 0 && s < 1440 && e > s && e <= 1440)) {
    return res.status(400).json({ ok: false, error: 'Invalid time range' });
  }
  if (await hasConflict(slot.vetId, weekday, s, e, slot.id)) {
    return res.status(409).json({ ok: false, error: 'Conflicting availability' });
  }

  const updated = await prisma.vetAvailability.update({
    where: { id: slot.id },
    data: { weekday, startMinutes: s, endMinutes: e }
  });
  res.json({ ok: true, slot: updated });
});

router.delete('/:id/availability/:slotId', ...adminOnly, async (req, res) => {
  const slot = await prisma.vetAvailability.findUnique({ where: { id: req.params.slotId } });
  if (!slot || slot.vetId !== req.params.id) return res.status(404).json({ ok: false, error: 'Not found' });

  await prisma.vetAvailability.delete({ where: { id: slot.id } });
  res.json({ ok: true, deleted: { id: slot.id } });
});

export default router;
