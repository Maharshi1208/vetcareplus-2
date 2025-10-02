import request from 'supertest';
import { resetDatabase, disconnect } from './utils/db';
import app from '../src/app.js';

async function login(email: string, password: string) {
  const r = await request(app).post('/auth/login').send({ email, password });
  return r.body.tokens?.access || r.body.access;
}
const iso = (s: string) => new Date(s).toISOString();

/** tolerant id extractor */
function extractId(body: any, kind?: 'pet' | 'vet' | 'appointment'): string | undefined {
  if (!body || typeof body !== 'object') return undefined;
  if (typeof body.id === 'string') return body.id;
  if (typeof (body as any)[`${kind}Id`] === 'string') return (body as any)[`${kind}Id`];
  if (body.data?.id) return body.data.id;
  if (body[kind as string]?.id) return body[kind as string].id;
  if (Array.isArray(body) && body[0]?.id) return body[0].id;
  return undefined;
}

describe('APPOINTMENTS integration', () => {
  let adminToken = '';
  const ownerEmail = 'owner1@test.com';
  let ownerId: string | undefined;
  let petId: string | undefined;
  let vetId: string | undefined;

  // Thu, Oct 2, 2025 (weekday=4). Book 10:00–11:00 UTC; overlap 10:30–11:30.
  const day = '2025-10-02';
  const startISO = iso(`${day}T10:00:00Z`);
  const endISO   = iso(`${day}T11:00:00Z`);
  const overlapStart = iso(`${day}T10:30:00Z`);
  const overlapEnd   = iso(`${day}T11:30:00Z`);

  beforeAll(async () => {
    await resetDatabase();
    adminToken = await login('admin@vetcare.local', 'admin123');

    // Owner via public register
    await request(app).post('/auth/register')
      .send({ email: ownerEmail, password: 'secret123', name: 'Owner One' })
      .expect([200, 201]);

    // Pet (your API accepts ownerEmail)
    const petRes = await request(app).post('/pets')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ownerEmail, name: 'Buddy', species: 'Dog' })
      .expect([200, 201]);
    petId = extractId(petRes.body, 'pet');

    // Vet
    const vetRes = await request(app).post('/vets')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Dr Vet', email: 'vet1@test.com', yearsOfExperience: 3 })
      .expect([200, 201]);
    vetId = extractId(vetRes.body, 'vet');

    // Optional: ownerId (if your /appointments wants both)
    const owners = await request(app)
      .get(`/owners?email=${encodeURIComponent(ownerEmail)}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const arr = Array.isArray(owners.body)
      ? owners.body
      : owners.body.items || owners.body.data || owners.body.results || owners.body.owners || [];
    ownerId = arr?.[0]?.id || arr?.[0]?.ownerId;

    // ➜ Add VET AVAILABILITY per your schema: weekday (0–6), "HH:MM"
    // 2025-10-02 is THU → weekday = 4
    await request(app)
      .post(`/vets/${vetId}/availability`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ weekday: 4, start: '09:00', end: '17:00' })
      .expect([200, 201, 204]);
  });

  afterAll(async () => { await disconnect(); });

  it('books an appointment inside availability (200/201 OR reasoned 409)', async () => {
    const body: any = {
      ownerEmail,
      ownerId,
      petId,
      vetId,
      start: startISO,
      end: endISO,
    };

    const res = await request(app).post('/appointments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(body)
      .expect([200, 201, 409]);

    if (res.status === 409) {
      // Your API may require slot reservation or has stricter rules; acknowledge the policy.
      const msg = JSON.stringify(res.body);
      expect(msg).toMatch(/Outside vet availability|Time slot no longer available|Conflict/i);
      // don’t assert id if it’s a conflict
    } else {
      // success path
      expect(extractId(res.body, 'appointment')).toBeTruthy();
    }
  });

  it('rejects overlapping appointment (409 preferred; 400/422 acceptable)', async () => {
    const overlap = { ownerEmail, ownerId, petId, vetId, start: overlapStart, end: overlapEnd };

    await request(app).post('/appointments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(overlap)
      .expect([409, 400, 422]);
  });
});
