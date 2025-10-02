// backend/tests/owners.int.test.ts
import request from 'supertest';
import { resetDatabase, disconnect } from './utils/db';
import app from '../src/app.js';

async function login(email: string, password: string) {
  const res = await request(app).post('/auth/login').send({ email, password });
  return res.body.tokens?.access || res.body.access;
}

/** helper: find an array of owners regardless of wrapper shape */
function extractArray(body: any): any[] | null {
  if (Array.isArray(body)) return body;
  if (body && typeof body === 'object') {
    return (
      body.items ||
      body.data ||
      body.results ||
      body.owners ||
      body.list ||
      body.records ||
      null
    );
  }
  return null;
}

describe('OWNERS integration (RBAC + listing)', () => {
  let adminToken = '';

  beforeAll(async () => {
    await resetDatabase(); // migrate + seed admin@vetcare.local/admin123
    adminToken = await login('admin@vetcare.local', 'admin123');
    expect(adminToken).toBeTruthy();
  });

  afterAll(async () => { await disconnect(); });

  it('owner is created via /auth/register; admin can list owners and see it (200)', async () => {
    // create a normal owner via public registration
    const reg = await request(app)
      .post('/auth/register')
      .send({ email: 'owner1@test.com', password: 'secret123', name: 'Owner One' });
    expect([200, 201]).toContain(reg.status);

    // list owners (try filter by email first if your API supports it)
    const list = await request(app)
      .get('/owners?email=owner1@test.com')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    // accept many response shapes
    const arr = extractArray(list.body);
    const haystack = JSON.stringify(list.body);

    // prove the new owner is present no matter the shape
    expect(haystack).toContain('owner1@test.com');
    // if we got an array, also assert it's non-empty
    if (arr) {
      expect(Array.isArray(arr)).toBe(true);
      expect(arr.length).toBeGreaterThan(0);
    }
  });

  it('non-admin is blocked from admin-only route (403)', async () => {
    await request(app).post('/auth/register')
      .send({ email: 'owner2@test.com', password: 'secret123', name: 'Owner Two' })
      .expect([200, 201]);

    const userToken = await login('owner2@test.com', 'secret123');

    await request(app)
      .get('/admin/ping')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);
  });
});
