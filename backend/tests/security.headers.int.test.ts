import request from 'supertest';
import app from '../src/app';

describe('Security headers via helmet', () => {
  it('sets basic headers on root', async () => {
    const r = await request(app).get('/').expect(200);
    expect(r.headers['x-content-type-options']).toBe('nosniff');
    // Helmet’s dnsPrefetchControl defaults to "off"
    expect(r.headers['x-dns-prefetch-control']).toBe('off');
  });
});
