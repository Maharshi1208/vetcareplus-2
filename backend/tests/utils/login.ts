// backend/tests/utils/login.ts
import request from 'supertest';

export const ADMIN_EMAIL = 'admin@vetcare.local';
export const ADMIN_PASSWORD = 'admin123';

/** -------- Extractors (throw if missing) -------- */
export function mustExtractId(body: any, key: string): string {
  const id =
    body?.id ??
    body?.[key]?.id ??
    body?.data?.id ??
    body?.[`${key}Id`];
  if (typeof id !== 'string' || !id) {
    throw new Error(`Could not extract "${key}" id from response: ${JSON.stringify(body)}`);
  }
  return id;
}

// Back-compat alias used by older tests; returns string (throws on miss)
export function extractId(body: any, key: string): string {
  return mustExtractId(body, key);
}

export function mustExtractToken(body: any): string {
  const token = body?.tokens?.access ?? body?.access ?? body?.token;
  if (typeof token !== 'string' || !token) {
    throw new Error(`Could not extract access token from response: ${JSON.stringify(body)}`);
  }
  return token;
}

// Back-compat alias; returns string (throws on miss)
export function extractToken(body: any): string {
  return mustExtractToken(body);
}

/** -------- High-level auth helpers -------- */
export async function loginAsAdmin(app: any): Promise<string> {
  const lr = await request(app)
    .post('/auth/login')
    .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    .expect(200);

  return mustExtractToken(lr.body); // <- fix: use lr.body (not lr.b…)
}

export async function register(
  app: any,
  payload: { email: string; password: string; name?: string; role?: string }
) {
  return request(app)
    .post('/auth/register')
    .send(payload)
    .expect([200, 201]);
}

export async function registerAndLogin(
  app: any,
  payload: { email: string; password: string; name?: string; role?: string }
): Promise<string> {
  await register(app, payload);
  const lr = await request(app)
    .post('/auth/login')
    .send({ email: payload.email, password: payload.password })
    .expect(200);

  return mustExtractToken(lr.body);
}
