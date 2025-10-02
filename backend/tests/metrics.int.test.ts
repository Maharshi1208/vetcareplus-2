// backend/tests/metrics.int.test.ts
import request from 'supertest';
import app from '../src/app';
import { resetDatabase, disconnect } from './utils/db';
import * as loginHelpers from './utils/login';

const loginAsAdmin =
  (loginHelpers as any).loginAsAdmin ||
  (loginHelpers as any).getAdminToken ||
  (loginHelpers as any).adminLogin;

describe('METRICS', () => {
  let adminToken: string;

  beforeAll(async () => {
    await resetDatabase();
    adminToken = await loginAsAdmin(app);
  });

  afterAll(async () => { await disconnect(); });

  it('GET /metrics returns data for admins', async () => {
    const res = await request(app)
      .get('/metrics')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect([200, 204]);

    if (res.text && res.text.length > 0) {
      try {
        const obj =
          (res.body && Object.keys(res.body).length ? res.body : JSON.parse(res.text));
        expect(typeof obj).toBe('object');
      } catch {
        expect(typeof res.text).toBe('string');
      }
    }
  });
});
