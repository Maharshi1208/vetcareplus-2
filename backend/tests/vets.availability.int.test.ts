import request from 'supertest';
import { resetDatabase, disconnect } from './utils/db';
import app from '../src/app.js';

async function login(email: string, password: string) {
  const r = await request(app).post('/auth/login').send({ email, password });
  return r.body.tokens?.access || r.body.access;
}

function getId(x: any, key?: string): string | undefined {
  if (!x) return undefined;
  if (typeof x.id === 'string') return x.id;
  if (key && x[key]?.id) return x[key].id;
  if (x.data?.id) return x.data.id;
  return undefined;
}

describe('VETS availability CRUD', () => {
  let adminToken = '';
  let vetId = '';
  let slotId = '';

  beforeAll(async () => {
    await resetDatabase();
    adminToken = await login('admin@vetcare.local', 'admin123');

    const vet = await request(app).post('/vets')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Dr Grid', email: 'grid@test.com', yearsOfExperience: 5 })
      .expect([200, 201]);

    vetId = getId(vet.body, 'vet')!;
    expect(vetId).toBeTruthy();
  });

  afterAll(async () => { await disconnect(); });

  it('creates availability slot (Thu 09:00–12:00) → 201', async () => {
    const res = await request(app)
      .post(`/vets/${vetId}/availability`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ weekday: 4, start: '09:00', end: '12:00' })
      .expect([200, 201]);

    // many APIs return the created slot; tolerate both {slot:{id}} and {id}
    slotId = res.body?.slot?.id || res.body?.id || '';
  });

  it('lists availability → contains our slot', async () => {
    const res = await request(app)
      .get(`/vets/${vetId}/availability`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const json = JSON.stringify(res.body);
    expect(json).toMatch(/09:00|540/); // start as HH:MM or minutes
    expect(json).toMatch(/12:00|720/); // end as HH:MM or minutes
  });

  it('rejects conflicting availability (overlap) → 409', async () => {
    await request(app)
      .post(`/vets/${vetId}/availability`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ weekday: 4, start: '11:00', end: '13:00' }) // overlaps 09–12
      .expect(409);
  });

  it('updates availability via PATCH (move to 10:00–13:00) → 200', async () => {
    // fetch list to get slot id if API didn’t return it
    if (!slotId) {
      const list = await request(app)
        .get(`/vets/${vetId}/availability`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      const arr =
        Array.isArray(list.body) ? list.body :
        list.body.items || list.body.data || list.body.availability || [];
      slotId = arr?.[0]?.id || '';
      expect(slotId).toBeTruthy();
    }

    await request(app)
      .patch(`/vets/${vetId}/availability/${slotId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ start: '10:00', end: '13:00' })
      .expect([200, 204]);
  });

  it('deletes availability slot → 200/204', async () => {
    await request(app)
      .delete(`/vets/${vetId}/availability/${slotId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect([200, 204]);

    const list = await request(app)
      .get(`/vets/${vetId}/availability`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const json = JSON.stringify(list.body);
    expect(json).not.toMatch(/10:00/);
  });
});
