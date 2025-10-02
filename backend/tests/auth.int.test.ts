// backend/tests/auth.int.test.ts
import request from 'supertest';
import { resetDatabase, disconnect } from './utils/db';
import app from '../src/app.js'; // if this import errors, change to '../src/app'

describe('AUTH integration', () => {
  beforeAll(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await disconnect();
  });

  it('register + login + me', async () => {
    // register
    const reg = await request(app)
      .post('/auth/register')
      .send({ email: 'owner2@test.com', password: 'secret123', name: 'Owner Two' });

    expect([200, 201]).toContain(reg.status);

    // login
    const login = await request(app)
      .post('/auth/login')
      .send({ email: 'owner2@test.com', password: 'secret123' })
      .expect(200);

    const token = login.body.tokens?.access || login.body.access;
    expect(token).toBeTruthy();

    // me
    await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });

  // Use a long-enough password so it passes body validation and hits auth logic → 401
  it('bad creds → 401', async () => {
    await request(app)
      .post('/auth/login')
      .send({ email: 'nouser@test.com', password: 'wrongpass123' })
      .expect(401);
  });

  // Optional: keep this if you also want to assert validation behaviour explicitly
  // it('invalid body → 400', async () => {
  //   await request(app)
  //     .post('/auth/login')
  //     .send({ email: 'nouser@test.com', password: 'nope' }) // too short → validation error
  //     .expect(400);
  // });
});
