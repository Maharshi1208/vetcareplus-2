import request from 'supertest';
import app from '../src/app';

describe('OpenAPI contract snapshot', () => {
  it('serves a valid OpenAPI doc with core paths present', async () => {
    const r = await request(app).get('/docs/openapi.json').expect(200);
    expect(typeof r.body).toBe('object');
    expect(typeof r.body.openapi).toBe('string');
    expect(r.body.openapi.startsWith('3')).toBe(true);

    const pathKeys = Object.keys(r.body.paths || {});
    const hasAuth = ['/auth/login', '/auth/register'].some(p => pathKeys.includes(p));
    expect(hasAuth).toBe(true);
  });
});
