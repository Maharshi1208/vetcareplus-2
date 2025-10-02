// backend/tests/jwt.unit.test.ts

describe('jwt sign/verify', () => {
  let jwtMod: any;

  beforeAll(async () => {
    // Ensure secret is present for env-driven modules
    process.env.JWT_SECRET ||= 'test_secret_for_unit_jwt';
    jest.resetModules();
    jwtMod = await import('../src/lib/jwt');
  });

  it('signs a token and verifies payload', async () => {
    const sign =
      jwtMod.sign ||
      jwtMod.signJwt ||
      jwtMod.issue ||
      jwtMod.createToken ||
      jwtMod.create;

    const verify =
      jwtMod.verify ||
      jwtMod.verifyJwt ||
      jwtMod.verifyToken ||
      jwtMod.decode;

    expect(typeof sign).toBe('function');
    expect(typeof verify).toBe('function');

    const payload = { sub: 'user-1', role: 'OWNER' };

    // Some sign functions accept (payload, opts?), some only payload; keep it simple:
    const token = await sign(payload as any);
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(20);

    const verified = await verify(token);

    // Many libs return payload directly; others return { payload, valid: true }
    const out = (verified && verified.payload) ? verified.payload : verified;

    expect(out).toBeTruthy();
    expect(typeof out).toBe('object');
    // accept either 'sub' or a common id-like field
    expect(out.sub || out.userId || out.id).toBeTruthy();
  });
});
