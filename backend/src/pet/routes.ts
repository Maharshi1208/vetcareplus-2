import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/db';
import { authRequired, AuthedRequest } from '../middleware/auth';

const router = Router();

const createSchema = z.object({
  name: z.string().min(1),
  species: z.string().optional(),
  breed: z.string().optional(),
  dob: z.string().datetime().optional(),   // ISO string if provided
  ownerId: z.string().cuid().optional(),   // ADMIN may create for someone else
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  species: z.string().optional(),
  breed: z.string().optional(),
  dob: z.string().datetime().nullable().optional(), // null to clear DOB
  archived: z.boolean().optional(),
  ownerId: z.string().cuid().optional(),   // ADMIN only
});

function isAdmin(req: AuthedRequest) {
  return req.user?.role === 'ADMIN';
}

// GET /pets?includeArchived=false
router.get('/', authRequired, async (req: AuthedRequest, res) => {
  const includeArchived = String(req.query.includeArchived ?? 'false') === 'true';

  const where = isAdmin(req)
    ? (includeArchived ? {} : { archived: false })
    : { ownerId: req.user!.sub, ...(includeArchived ? {} : { archived: false }) };

  const pets = await prisma.pet.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, name: true, species: true, breed: true, dob: true,
      archived: true, ownerId: true, createdAt: true, updatedAt: true
    }
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
      dob: data.dob ? new Date(data.dob) : undefined,
    },
    select: {
      id: true, name: true, species: true, breed: true, dob: true,
      archived: true, ownerId: true, createdAt: true, updatedAt: true
    }
  });
  res.status(201).json({ ok: true, pet });
});

async function loadScopedPet(req: AuthedRequest, id: string) {
  const pet = await prisma.pet.findUnique({ where: { id } });
  if (!pet) return { error: 404 as const, pet: null };
  if (!isAdmin(req) && pet.ownerId !== req.user!.sub) return { error: 404 as const, pet: null }; // hide existence
  return { error: null as null, pet };
}

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

  // Only ADMIN may reassign ownerId
  if (data.ownerId && !isAdmin(req)) {
    return res.status(403).json({ ok: false, error: 'Forbidden: ownerId change requires ADMIN' });
  }

  const updated = await prisma.pet.update({
    where: { id },
    data: {
      name: data.name ?? undefined,
      species: data.species ?? undefined,
      breed: data.breed ?? undefined,
      dob: data.dob === undefined ? undefined : (data.dob ? new Date(data.dob) : null),
      archived: data.archived ?? undefined,
      ...(isAdmin(req) && data.ownerId ? { ownerId: data.ownerId } : {}),
    },
    select: {
      id: true, name: true, species: true, breed: true, dob: true,
      archived: true, ownerId: true, createdAt: true, updatedAt: true
    }
  });
  res.json({ ok: true, pet: updated });
});

// DELETE /pets/:id  → soft delete (archived=true)
router.delete('/:id', authRequired, async (req: AuthedRequest, res) => {
  const { id } = req.params;
  const { error, pet } = await loadScopedPet(req, id);
  if (error || !pet) return res.status(404).json({ ok: false, error: 'Not found' });

  const updated = await prisma.pet.update({
    where: { id },
    data: { archived: true },
    select: { id: true, archived: true }
  });
  res.json({ ok: true, pet: updated });
});

export default router;
