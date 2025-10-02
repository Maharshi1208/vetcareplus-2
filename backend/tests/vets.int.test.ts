import request from 'supertest';
import app from '../src/app';
import { resetDatabase, disconnect } from './utils/db';

function tokenFrom(body: any) {
  return body?.tokens?.access || body?.access || body?.token;
}
function extractId(body: any, key?: string) {
  return body?.id || body?.[key || '']?.id || body?.data?.id || body?.[key || 'Id'];
}

describe('VETS availability CRUD (ADMIN)', () => {
  let adminToken = '';
  let vetId = '';
  let slotId = '';

  beforeAll(async () => {
    await resetDatabase();
    // login as seeded admin (seed.ts prints creds: admin@vetcare.local / admin123)
    const login = await request(app).post('/auth/login').send({
      email: 'admin@vetcare.local',
      password: 'admin123',
    });
    expect([200, 201]).toContain(login.status);
    adminToken = tokenFrom(login.body);
    expect(adminToken).toBeTruthy();
  });

  afterAll(async () => {
    await disconnect();
  });

  it('creates a vet (201)', async () => {
    const res = await request(app)
      .post('/vets')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Dr. CRUD', email: 'crud@vet.test', specialty: 'General' });
    expect([200, 201]).toContain(res.status);
    vetId = extractId(res.body, 'vet');
    expect(vetId).toBeTruthy();
  });

  it('adds availability (201) and lists it (200)', async () => {
    const create = await request(app)
      .post(`/vets/${vetId}/availability`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ weekday: 2, start: '09:00', end: '17:00' });

    expect([200, 201]).toContain(create.status);
    slotId = extractId(create.body, 'slot');
    expect(slotId).toBeTruthy();

    const list = await request(app)
      .get(`/vets/${vetId}/availability`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(list.status).toBe(200);
    const items = list.body?.availability || list.body || [];
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThan(0);
  });

  it('patches availability (200)', async () => {
    const patch = await request(app)
      .patch(`/vets/${vetId}/availability/${slotId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ start: '10:00', end: '16:00' });

    expect([200, 204]).toContain(patch.status);
  });

  it('rejects an overlapping slot (409)', async () => {
    const conflict = await request(app)
      .post(`/vets/${vetId}/availability`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ weekday: 2, start: '10:30', end: '11:30' });

    // your route returns 409 on overlap
    expect(conflict.status).toBe(409);
  });

  it('deletes availability (200/204) and can add again (201)', async () => {
    const del = await request(app)
      .delete(`/vets/${vetId}/availability/${slotId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect([200, 204]).toContain(del.status);

    // now add same hours again (should succeed because previous one is gone)
    const reAdd = await request(app)
      .post(`/vets/${vetId}/availability`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ weekday: 2, start: '10:00', end: '16:00' });

    expect([200, 201]).toContain(reAdd.status);
  });
});
