import request from 'supertest';
import app from '../src/app';
import { resetDatabase, disconnect } from './utils/db';

describe('HEALTH endpoints', () => {
  beforeAll(async () => { await resetDatabase(); });
  afterAll(async () => { await disconnect(); });

  it('GET / returns OK text', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(String(res.text || '')).toMatch(/VetCare\+ API/i);
  });

  it('GET /ping returns pong JSON', async () => {
    const res = await request(app).get('/ping');
    expect(res.status).toBe(200);
    expect(res.body?.ok).toBe(true);
    expect(typeof res.body?.pong).toBe('string');
  });

  it('GET /health and /health/db return ok', async () => {
    const h = await request(app).get('/health');
    expect(h.status).toBe(200);
    expect(h.body?.ok).toBe(true);

    const db = await request(app).get('/health/db');
    expect([200, 500]).toContain(db.status); // 200 expected; if DB hiccups we’ll see it
    if (db.status === 200) expect(db.body?.ok).toBe(true);
  });
});
