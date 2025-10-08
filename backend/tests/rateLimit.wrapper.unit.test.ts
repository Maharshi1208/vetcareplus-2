// backend/tests/rateLimit.wrapper.unit.test.ts
import { rateLimiter } from '../src/middleware/rateLimit.js';

function run(headers: Record<string, string> = {}) {
  const req: any = { headers };
  const res: any = {
    statusCode: 200,
    status(code: number) { this.statusCode = code; return this; },
    json() { /* no-op */ }
  };
  let called = false;
  const next = () => { called = true; };
  rateLimiter(req, res, next);
  return called;
}

describe('rateLimiter wrapper', () => {
  const OLD = process.env.NODE_ENV;
  afterAll(() => { process.env.NODE_ENV = OLD; });

  it('bypasses when NODE_ENV=test', () => {
    process.env.NODE_ENV = 'test';
    expect(run()).toBe(true);
  });

  it('bypasses when X-Test-Bypass: 1', () => {
    process.env.NODE_ENV = 'development';
    expect(run({ 'x-test-bypass': '1' })).toBe(true);
  });
});
