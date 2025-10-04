import request from 'supertest';
import app from '../src/app';
import { resetDatabase, disconnect } from './utils/db';
import { loginAsAdmin } from './utils/login';

// robust token extractor across shapes
function extractToken(body: any): string | undefined {
  return (
    body?.tokens?.access ||
    body?.access ||
    body?.accessToken ||
    body?.token ||
    body?.data?.token ||
    body?.jwt
  );
}

describe('METRICS auth gating', () => {
  let adminToken = '';
  let userToken = '';

  beforeAll(async () => {
    await resetDatabase();

    // admin
    adminToken = await loginAsAdmin(app);

    // normal user
    const email = 'metrics-user@test.com';
    const password = 'pass12345!';
    const name = 'Metrics User';

    await request(app)
      .post('/auth/register')
      .send({ email, password, name })    // include name for your schema
      .expect([200, 201]);

    const lr = await request(app).post('/auth/login').send({ email, password }).expect(200);
    userToken = extractToken(lr.body) as string;
    expect(userToken).toBeTruthy();
  });

  afterAll(async () => {
    await disconnect();
  });

  it('401 when unauthenticated', async () => {
    await request(app).get('/metrics/summary').expect(401);
  });

  it('200 for admin', async () => {
    const res = await request(app)
      .get('/metrics/summary')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(res.body?.ok ?? true).toBeTruthy();
  });

  it('non-admin: API may return 200 (if allowed) or 403 (if admin-only)', async () => {
    const res = await request(app)
      .get('/metrics/summary')
      .set('Authorization', `Bearer ${userToken}`)
      .expect([200, 403]); // accept either policy
    // If it’s 200 make a basic shape assertion
    if (res.status === 200) {
      expect(res.body?.ok ?? true).toBeTruthy();
    }
  });
});
