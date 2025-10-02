// backend/tests/health.int.test.ts
import request from 'supertest';
import app from '../src/app';
import { resetDatabase, disconnect } from './utils/db';

describe('HEALTH & DOCS', () => {
  beforeAll(async () => { await resetDatabase(); });
  afterAll(async () => { await disconnect(); });

  it('GET / returns a running message', async () => {
    const res = await request(app).get('/').expect(200);
    expect(String(res.text).toLowerCase()).toContain('vetcare');
  });

  it('GET /ping returns ok + ISO timestamp', async () => {
    const res = await request(app).get('/ping').expect(200);
    expect(res.body.ok).toBe(true);
    expect(typeof res.body.pong).toBe('string');
  });

  it('GET /health returns system status', async () => {
    const res = await request(app).get('/health').expect(200);
    expect(res.body.ok).toBe(true);
    expect(typeof res.body.uptime).toBe('number');
    expect(typeof res.body.timestamp).toBe('string');
  });

  it('GET /health/db returns ok boolean (200 or 500)', async () => {
    const r = await request(app).get('/health/db');
    expect([200, 500]).toContain(r.status);
    expect(typeof r.body.ok).toBe('boolean');
  });

  it('GET /docs/openapi.json exposes an OpenAPI spec', async () => {
    const res = await request(app).get('/docs/openapi.json').expect(200);
    const spec = res.body;
    expect(spec).toBeTruthy();
    // OpenAPI v3 has an 'openapi' field and 'info' object
    expect(spec.openapi || spec.openapiVersion || spec.info).toBeTruthy();
  });
});
