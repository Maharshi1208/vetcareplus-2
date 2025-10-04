import request from 'supertest';
import app from '../src/app';
import { resetDatabase, disconnect } from './utils/db';
import { loginAsAdmin } from './utils/login';

describe('VALIDATION errors', () => {
  let adminToken = '';

  beforeAll(async () => {
    await resetDatabase();
    adminToken = await loginAsAdmin(app);   // IMPORTANT: pass app
  });

  afterAll(async () => {
    await disconnect();
  });

  it('rejects invalid vet create (400 with fieldErrors)', async () => {
    const res = await request(app)
      .post('/vets') // implemented ADMIN endpoint
      .set('Authorization', `Bearer ${adminToken}`)
      // invalid: missing required name + bad email format
      .send({ email: 'not-an-email' })
      .expect(400);

    const err = res.body?.error;
    expect(err).toBeTruthy();
    // support both zod.flatten() and zod.issues style shapes
    expect(err.fieldErrors || err.issues || err.message).toBeTruthy();
  });

  it('rejects invalid appointment (400/422)', async () => {
    const res = await request(app)
      .post('/appointments')
      .set('Authorization', `Bearer ${adminToken}`)
      // clearly invalid shape/values
      .send({ start: 'bad', end: 'also-bad' })
      .expect([400, 422]);
    expect(res.body?.ok).toBe(false);
  });
});
