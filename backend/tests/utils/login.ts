// backend/tests/utils/login.ts
import request from 'supertest';

/**
 * Logs in with the seeded admin user.
 * Pass the Express app instance used in your test.
 * Returns the access token string.
 */
export async function loginAsAdmin(app: any): Promise<string> {
  const res = await request(app)
    .post('/auth/login')
    .send({ email: 'admin@vetcare.local', password: 'admin123' })
    .expect(200);

  // Be tolerant of different token shapes
  return (
    res.body?.tokens?.access ||
    res.body?.access ||
    res.body?.token ||
    ''
  );
}

// Back-compat alias some tests may import
export const getAdminToken = loginAsAdmin;
