// backend/tests/hash.unit.test.ts
import * as mod from '../src/lib/hash';
import bcryptjs from 'bcryptjs';

describe('hash helpers', () => {
  it('hash + compare works (module compare or bcrypt fallback)', async () => {
    const hashFn =
      (mod as any).hash ||
      (mod as any).hashPassword ||
      (mod as any).make ||
      (mod as any).createHash;

    const compareFn =
      (mod as any).compare ||
      (mod as any).comparePassword ||
      (mod as any).verify ||
      (mod as any).check ||
      (mod as any).compareHash ||
      (mod as any).isMatch;

    expect(typeof hashFn).toBe('function');

    const plain = 'P@ssw0rd!42';
    const hashed = await hashFn(plain);

    expect(hashed).toBeTruthy();
    expect(hashed).not.toEqual(plain);

    // Use module-provided compare if available; otherwise bcryptjs fallback
    const ok = compareFn
      ? await compareFn(plain, hashed)
      : bcryptjs.compareSync(plain, hashed);
    expect(ok).toBe(true);

    const bad = compareFn
      ? await compareFn('wrong-pass', hashed)
      : bcryptjs.compareSync('wrong-pass', hashed);
    expect(bad).toBe(false);
  });
});
