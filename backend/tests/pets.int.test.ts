// backend/tests/pets.int.test.ts
import request from 'supertest';
import { resetDatabase, disconnect } from './utils/db';
import app from '../src/app.js';

async function login(email: string, password: string) {
  const r = await request(app).post('/auth/login').send({ email, password });
  return r.body.tokens?.access || r.body.access;
}

function extractArray(body: any): any[] | null {
  if (Array.isArray(body)) return body;
  if (body && typeof body === 'object') {
    return (
      body.items ||
      body.data ||
      body.results ||
      body.pets ||
      body.list ||
      body.records ||
      null
    );
  }
  return null;
}

function extractPetId(body: any): string | undefined {
  if (!body || typeof body !== 'object') return undefined;
  // common shapes
  return (
    body.id ||
    body.petId ||
    body?.data?.id ||
    body?.pet?.id ||
    body?.result?.id ||
    (Array.isArray(body) ? body[0]?.id : undefined)
  );
}

describe('PETS integration', () => {
  let adminToken = '';

  beforeAll(async () => {
    await resetDatabase();
    adminToken = await login('admin@vetcare.local', 'admin123');
    expect(adminToken).toBeTruthy();
  });

  afterAll(async () => { await disconnect(); });

  it('creates pet for owner and lists by owner (200/201)', async () => {
    // 1) register an owner (public)
    const email = 'owner1@test.com';
    const reg = await request(app)
      .post('/auth/register')
      .send({ email, password: 'secret123', name: 'Owner One' });
    expect([200, 201]).toContain(reg.status);

    // 2) (optional) list owners to prove presence
    const ownersRes = await request(app)
      .get(`/owners?email=${encodeURIComponent(email)}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(JSON.stringify(ownersRes.body)).toContain(email);

    // 3) create pet — your API accepted ownerEmail earlier, keep that
    const pet = await request(app)
      .post('/pets')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ownerEmail: email, name: 'Buddy', species: 'Dog' });
    expect([200, 201]).toContain(pet.status);

    const newPetId = extractPetId(pet.body);
    expect(newPetId).toBeTruthy();

    // 4) list pets by owner (prefer ownerEmail filter)
    const list = await request(app)
      .get(`/pets?ownerEmail=${encodeURIComponent(email)}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const petsArr = extractArray(list.body);
    const listJson = JSON.stringify(list.body);
    expect(listJson).toContain('Buddy');
    if (petsArr) {
      expect(Array.isArray(petsArr)).toBe(true);
      expect(petsArr.length).toBeGreaterThan(0);
    }
  });
});
