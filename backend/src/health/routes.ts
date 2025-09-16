import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/db';
import { authRequired, AuthedRequest } from '../middleware/auth';

const router = Router();
const isAdmin = (req: AuthedRequest) => req.user?.role === 'ADMIN';

// ---------- Helpers ----------
async function canUsePet(req: AuthedRequest, petId: string) {
  if (isAdmin(req)) return true;
  const pet = await prisma.pet.findUnique({ where: { id: petId }, select: { ownerId: true } });
  return !!pet && pet.ownerId === req.user!.sub;
}
function toDate(s: string) {
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) throw new Error('Invalid date');
  return d;
}

// ---------- Schemas ----------
const vaccinationCreate = z.object({
  petId: z.string().cuid(),
  name: z.string().min(1),
  givenAt: z.string(),     // ISO RFC3339 e.g. "2024-06-01T00:00:00.000Z"
  notes: z.string().optional(),
});

const medicationCreate = z.object({
  petId: z.string().cuid(),
  name: z.string().min(1),
  dosage: z.string().min(1),      // free text dosage
  startAt: z.string(),            // ISO datetime
  durationDays: z.number().int().positive(),
  notes: z.string().optional(),
});

const medicationUpdate = z.object({
  dosage: z.string().min(1).optional(),
  durationDays: z.number().int().positive().optional(),
  notes: z.string().optional(),
});

// ---------- Vaccinations (immutable) ----------
router.post('/vaccinations', authRequired, async (req: AuthedRequest, res) => {
  const parsed = vaccinationCreate.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.flatten() });

  const { petId, name, givenAt, notes } = parsed.data;
  if (!(await canUsePet(req, petId))) return res.status(403).json({ ok: false, error: 'Forbidden: pet not owned' });

  let at: Date;
  try { at = toDate(givenAt); } catch { return res.status(400).json({ ok: false, error: 'Invalid date' }); }

  const vax = await prisma.vaccination.create({ data: { petId, name, givenAt: at, notes } });
  res.status(201).json({ ok: true, vaccination: vax });
});

router.get('/vaccinations', authRequired, async (req: AuthedRequest, res) => {
  const petId = String(req.query.petId ?? '');
  if (!petId) return res.status(400).json({ ok: false, error: 'petId required' });
  if (!(await canUsePet(req, petId))) return res.status(403).json({ ok: false, error: 'Forbidden' });

  const items = await prisma.vaccination.findMany({
    where: { petId },
    orderBy: { givenAt: 'desc' }
  });
  res.json({ ok: true, vaccinations: items });
});

// No PATCH/DELETE for vaccinations (immutable)

// ---------- Medications ----------
router.post('/medications', authRequired, async (req: AuthedRequest, res) => {
  const parsed = medicationCreate.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.flatten() });

  const { petId, name, dosage, startAt, durationDays, notes } = parsed.data;
  if (!(await canUsePet(req, petId))) return res.status(403).json({ ok: false, error: 'Forbidden: pet not owned' });

  let start: Date;
  try { start = toDate(startAt); } catch { return res.status(400).json({ ok: false, error: 'Invalid date' }); }

  const med = await prisma.medication.create({
    data: { petId, name, dosage, startAt: start, durationDays, notes }
  });
  res.status(201).json({ ok: true, medication: med });
});

router.get('/medications', authRequired, async (req: AuthedRequest, res) => {
  const petId = String(req.query.petId ?? '');
  if (!petId) return res.status(400).json({ ok: false, error: 'petId required' });
  if (!(await canUsePet(req, petId))) return res.status(403).json({ ok: false, error: 'Forbidden' });

  const items = await prisma.medication.findMany({
    where: { petId },
    orderBy: { startAt: 'desc' }
  });
  res.json({ ok: true, medications: items });
});

// limited update (notes/dosage/durationDays)
router.patch('/medications/:id', authRequired, async (req: AuthedRequest, res) => {
  const parsed = medicationUpdate.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.flatten() });

  const med = await prisma.medication.findUnique({
    where: { id: req.params.id },
    select: { id: true, petId: true, pet: { select: { ownerId: true } } }
  });
  if (!med) return res.status(404).json({ ok: false, error: 'Not found' });
  if (!isAdmin(req) && med.pet.ownerId !== req.user!.sub) return res.status(403).json({ ok: false, error: 'Forbidden' });

  const updated = await prisma.medication.update({
    where: { id: med.id },
    data: parsed.data
  });
  res.json({ ok: true, medication: updated });
});

// ---------- Timeline (combined) ----------
router.get('/timeline/:petId', authRequired, async (req: AuthedRequest, res) => {
  const petId = req.params.petId;
  if (!(await canUsePet(req, petId))) return res.status(403).json({ ok: false, error: 'Forbidden' });

  const [vax, meds, appts] = await Promise.all([
    prisma.vaccination.findMany({ where: { petId }, orderBy: { givenAt: 'desc' } }),
    prisma.medication.findMany({ where: { petId }, orderBy: { startAt: 'desc' } }),
    prisma.appointment.findMany({
      where: { petId, status: { in: ['BOOKED', 'COMPLETED'] } },
      orderBy: { start: 'desc' },
      select: { id: true, start: true, end: true, status: true, vet: { select: { name: true } }, reason: true }
    }),
  ]);

  const items = [
    ...vax.map(v => ({ type: 'VACCINATION' as const, date: v.givenAt, title: v.name, details: v.notes ?? '', id: v.id })),
    ...meds.map(m => ({ type: 'MEDICATION' as const, date: m.startAt, title: `${m.name} (${m.dosage})`, details: `for ${m.durationDays} day(s)${m.notes ? ' — '+m.notes : ''}`, id: m.id })),
    ...appts.map(a => ({ type: 'APPOINTMENT' as const, date: a.start, title: `Appointment with ${a.vet.name}`, details: a.reason ?? a.status, id: a.id })),
  ].sort((a, b) => +new Date(b.date) - +new Date(a.date));

  res.json({ ok: true, timeline: items });
});

export default router;
