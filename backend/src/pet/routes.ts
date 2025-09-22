// src/pets/routes.ts
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/db.js';
import { authRequired, AuthedRequest } from '../middleware/auth.js';

const router = Router();

// -------------------- Schemas --------------------
const createSchema = z.object({
  name: z.string().min(1),
  species: z.string().optional(),
  breed: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'UNKNOWN']).optional(),
  color: z.string().optional(),
  dob: z.string().datetime().optional(),  // ISO string
  ageYears: z.number().int().min(0).optional(),
  ageMonths: z.number().int().min(0).max(11).optional(),
  weightKg: z.number().positive().optional(),
  microchipId: z.string().optional(),
  vaccinated: z.boolean().optional(),
  neutered: z.boolean().optional(),
  notes: z.string().optional(),
  ownerId: z.string().cuid().optional(),   // ADMIN may create for someone else
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  species: z.string().optional(),
  breed: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'UNKNOWN']).optional(),
  color: z.string().optional(),
  dob: z.string().datetime().nullable().optional(), // null = clear DOB
  ageYears: z.number().int().min(0).nullable().optional(),
  ageMonths: z.number().int().min(0).max(11).nullable().optional(),
  weightKg: z.number().positive().nullable().optional(),
  microchipId: z.string().nullable().optional(),
  vaccinated: z.boolean().nullable().optional(),
  neutered: z.boolean().nullable().optional(),
  notes: z.string().nullable().optional(),
  archived: z.boolean().optional(),
  ownerId: z.string().cuid().optional(),   // ADMIN only
});

// -------------------- Helpers --------------------
function isAdmin(req: AuthedRequest) {
  return req.user?.role === 'ADMIN';
}

async function loadScopedPet(req: AuthedRequest, id: string) {
  const pet = await prisma.pet.findUnique({ where: { id } });
  if (!pet) return { error: 404 as const, pet: null };
  if (!isAdmin(req) && pet.ownerId !== req.user!.sub) return { error: 404 as const, pet: null };
  return { error: null as null, pet };
}

// -------------------- Routes --------------------

// GET /pets?includeArchived=false
router.get('/', authRequired, async (req: AuthedRequest, res) => {
  const includeArchived = String(req.query.includeArchived ?? 'false') === 'true';

  const where = isAdmin(req)
    ? (includeArchived ? {} : { archived: false })
    : { ownerId: req.user!.sub, ...(includeArchived ? {} : { archived: false }) };

  const pets = await prisma.pet.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
  res.json({ ok: true, pets });
});

// POST /pets
router.post('/', authRequired, async (req: AuthedRequest, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.flatten() });

  const data = parsed.data;
  const ownerId = isAdmin(req) && data.ownerId ? data.ownerId : req.user!.sub;

  const pet = await prisma.pet.create({
    data: {
      ownerId,
      name: data.name,
      species: data.species,
      breed: data.breed,
      gender: data.gender,
      color: data.color,
      dob: data.dob ? new Date(data.dob) : undefined,
      ageYears: data.ageYears,
      ageMonths: data.ageMonths,
      weightKg: data.weightKg,
      microchipId: data.microchipId,
      vaccinated: data.vaccinated,
      neutered: data.neutered,
      notes: data.notes,
    },
  });
  res.status(201).json({ ok: true, pet });
});

// GET /pets/:id
router.get('/:id', authRequired, async (req: AuthedRequest, res) => {
  const { id } = req.params;
  const { error, pet } = await loadScopedPet(req, id);
  if (error || !pet) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, pet });
});

// PATCH /pets/:id
router.patch('/:id', authRequired, async (req: AuthedRequest, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.flatten() });

  const { id } = req.params;
  const { error, pet } = await loadScopedPet(req, id);
  if (error || !pet) return res.status(404).json({ ok: false, error: 'Not found' });

  const data = parsed.data;

  if (data.ownerId && !isAdmin(req)) {
    return res.status(403).json({ ok: false, error: 'Forbidden: ownerId change requires ADMIN' });
  }

  const updated = await prisma.pet.update({
    where: { id },
    data: {
      name: data.name ?? undefined,
      species: data.species ?? undefined,
      breed: data.breed ?? undefined,
      gender: data.gender ?? undefined,
      color: data.color ?? undefined,
      dob: data.dob === undefined ? undefined : (data.dob ? new Date(data.dob) : null),
      ageYears: data.ageYears ?? undefined,
      ageMonths: data.ageMonths ?? undefined,
      weightKg: data.weightKg ?? undefined,
      microchipId: data.microchipId ?? undefined,
      vaccinated: data.vaccinated ?? undefined,
      neutered: data.neutered ?? undefined,
      notes: data.notes ?? undefined,
      archived: data.archived ?? undefined,
      ...(isAdmin(req) && data.ownerId ? { ownerId: data.ownerId } : {}),
    },
  });
  res.json({ ok: true, pet: updated });
});

// DELETE /pets/:id → soft delete (archived=true)
router.delete('/:id', authRequired, async (req: AuthedRequest, res) => {
  const { id } = req.params;
  const { error, pet } = await loadScopedPet(req, id);
  if (error || !pet) return res.status(404).json({ ok: false, error: 'Not found' });

  const updated = await prisma.pet.update({
    where: { id },
    data: { archived: true },
    select: { id: true, archived: true },
  });
  res.json({ ok: true, pet: updated });
});

export default router;