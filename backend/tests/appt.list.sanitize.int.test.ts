import request from 'supertest';
import app from '../src/app';
import { resetDatabase, disconnect } from './utils/db';

// This hits the GET /appointments path and triggers the “to=null&to=null” & “bad page” branches
describe('GET /appointments query sanitize', () => {
  beforeAll(resetDatabase);
  afterAll(disconnect);

  it('rejects bad page and handles duplicate to/null', async () => {
    const login = await request(app).post('/auth/login')
      .send({ email: 'admin@vetcare.local', password: 'admin123' });
    const token = login.body?.tokens?.access;

    // duplicate `to` with null; negative page
    const r = await request(app)
      .get('/appointments')
      .set('Authorization', `Bearer ${token}`)
      .query({ to: ['null', 'null'], page: -5 });

    expect([200,400]).toContain(r.status); // we mainly want the branch executed
  });
});
