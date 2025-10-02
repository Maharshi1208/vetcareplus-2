import { isOverlapping } from '../src/lib/conflicts';
const d = (s: string) => new Date(s);
describe('isOverlapping', () => {
  it('detects overlap', () => {
    expect(isOverlapping(d('2025-09-30T10:00:00Z'), d('2025-09-30T11:00:00Z'),
                         d('2025-09-30T10:30:00Z'), d('2025-09-30T11:30:00Z'))).toBe(true);
  });
  it('no overlap when abutting', () => {
    expect(isOverlapping(d('2025-09-30T10:00:00Z'), d('2025-09-30T11:00:00Z'),
                         d('2025-09-30T11:00:00Z'), d('2025-09-30T12:00:00Z'))).toBe(false);
  });
});
