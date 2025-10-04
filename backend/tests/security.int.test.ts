import request from 'supertest';
import app from '../src/app';
import { resetDatabase, disconnect } from './utils/db';

describe('SECURITY & CORS', () => {
  beforeAll(async () => {
    await resetDatabase();
  });
  afterAll(async () => {
    await disconnect();
  });

  it('CORS preflight allows our frontend origin', async () => {
    const res = await request(app)
      .options('/ping')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'GET')
      .expect([200, 204]);

    // Accept exact match or wildcard
    const allow = res.headers['access-control-allow-origin'];
    expect(allow === 'http://localhost:5173' || allow === '*').toBe(true);
  });

  it('Helmet sets common security headers', async () => {
    const res = await request(app).get('/ping').expect(200);

    const h = res.headers;
    // A few stable Helmet headers (don’t assert every single one)
    expect(h).toHaveProperty('x-dns-prefetch-control');
    expect(h).toHaveProperty('x-content-type-options');
    expect(h).toHaveProperty('x-frame-options');
    // Referrer-Policy is set via Helmet’s defaults
    expect(h).toHaveProperty('referrer-policy');
  });
});
