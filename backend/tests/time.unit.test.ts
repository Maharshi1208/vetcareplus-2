// backend/tests/time.unit.test.ts
import { hhmmToMinutes } from '../src/lib/time';

describe('time utils', () => {
  it('hhmmToMinutes converts correctly', () => {
    expect(hhmmToMinutes('00:00')).toBe(0);
    expect(hhmmToMinutes('00:01')).toBe(1);
    expect(hhmmToMinutes('01:00')).toBe(60);
    expect(hhmmToMinutes('09:30')).toBe(570);
    expect(hhmmToMinutes('23:59')).toBe(23 * 60 + 59);
  });

  it('rejects invalid formats/ranges', () => {
    const bad = ['24:00', '12:60', '99:99', 'abc', '1:1', '', '  '];
    for (const s of bad) {
      expect(() => hhmmToMinutes(s as any)).toThrow();
    }
  });
});
