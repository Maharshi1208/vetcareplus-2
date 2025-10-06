import { describe, it, expect } from 'vitest';
import { authHeaders } from './authHeaders';

describe('authHeaders()', () => {
  it('returns Accept header by default', () => {
    expect(authHeaders()).toEqual({ Accept: 'application/json' });
  });
  it('adds Authorization when token present', () => {
    expect(authHeaders('abc')).toEqual({
      Accept: 'application/json',
      Authorization: 'Bearer abc',
    });
  });
});
