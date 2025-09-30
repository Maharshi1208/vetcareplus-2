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
function isVet(req: AuthedRequest) {
  return req.user?.role === 'VET';
}

async function loadScopedPet(req: AuthedRequest, id: string) {
  const pet = await prisma.pet.findUnique({ where: { id } });
  if (!pet) return { error: 404 as const, pet: null };
  if (!isAdmin(req) && pet.ownerId !== req.user!.sub) return { error: 404 as const, pet: null };
  return { error: null as null, pet };
}

// Common minimal owner selection used below
const ownerSelect = { id: true, name: true, email: true } as const;

// -------------------- Dropdown endpoint (ARRAY) --------------------
// GET /pets/select?ownerId=me|<uuid>&includeArchived=false
// - Returns ARRAY: [{ id, name, ownerId }]
router.get('/select', authRequired, async (req: AuthedRequest, res) => {
  const includeArchived = String(req.query.includeArchived ?? 'false') === 'true';
  const ownerIdParam = (req.query.ownerId as string | undefined) || '';

  let where: any = includeArchived ? {} : { archived: false };

  if (isAdmin(req)) {
    if (ownerIdParam === 'me') where.ownerId = req.user!.sub;
    else if (ownerIdParam) where.ownerId = ownerIdParam;
    // else: all pets
  } else if (req.user?.role === 'OWNER') {
    where.ownerId = req.user!.sub;
  } else if (isVet(req)) {
    if (ownerIdParam === 'me') where.ownerId = req.user!.sub;
    else if (ownerIdParam) where.ownerId = ownerIdParam;
    else where.ownerId = req.user!.sub; // usually yields none for vets
  }

  const items = await prisma.pet.findMany({
    where,
    select: { id: true, name: true, ownerId: true },
    orderBy: { name: 'asc' },
  });

  res.setHeader('X-Total-Count', String(items.length));
  return res.json(items);
});

// -------------------- Routes --------------------

// GET /pets?includeArchived=false&ownerId=me|<uuid>
// Response: { ok: true, pets }  (now includes owner: {id,name,email})
router.get('/', authRequired, async (req: AuthedRequest, res) => {
  const includeArchived = String(req.query.includeArchived ?? 'false') === 'true';
  const ownerIdParam = (req.query.ownerId as string | undefined) || '';

  let where: any = isAdmin(req)
    ? (includeArchived ? {} : { archived: false })
    : { ownerId: req.user!.sub, ...(includeArchived ? {} : { archived: false }) };

  if (isAdmin(req)) {
    if (ownerIdParam === 'me') where = { ...where, ownerId: req.user!.sub };
    else if (ownerIdParam) where = { ...where, ownerId: ownerIdParam };
  } else if (req.user?.role === 'OWNER') {
    if (ownerIdParam && ownerIdParam !== 'me') {
      return res.status(403).json({ ok: false, error: 'Forbidden' });
    }
  } else if (isVet(req)) {
    // keep existing vet behavior on this endpoint
  }

  const pets = await prisma.pet.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { owner: { select: ownerSelect } }, // ← include owner for table rendering
  });

  res.json({ ok: true, pets });
});

// POST /pets  (returns created pet with owner for immediate UI display)
router.post('/', authRequired, async (req: AuthedRequest, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.flatten() });

  const data = parsed.data;
  const ownerId = isAdmin(req) && data.ownerId ? data.ownerId : req.user!.sub;

  const pet = await prisma.pet.create({
    data: {
      owner: { connect: { id: ownerId } }, // set relation
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
    include: { owner: { select: ownerSelect } }, // ← return owner details too
  });

  res.status(201).json({ ok: true, pet });
});

// GET /pets/:id (returns pet with owner)
router.get('/:id', authRequired, async (req: AuthedRequest, res) => {
  const { id } = req.params;
  const { error, pet } = await loadScopedPet(req, id);
  if (error || !pet) return res.status(404).json({ ok: false, error: 'Not found' });

  const withOwner = await prisma.pet.findUnique({
    where: { id: pet.id },
    include: { owner: { select: ownerSelect } }, // ← include owner
  });

  res.json({ ok: true, pet: withOwner });
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
    include: { owner: { select: ownerSelect } }, // ← handy for immediate UI refresh
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
