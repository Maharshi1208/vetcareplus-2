// src/test/setup-a11y.ts
import { afterEach, expect } from 'vitest';
import { cleanup } from '@testing-library/react';
import { toHaveNoViolations } from 'jest-axe';

// add jest-axe matchers to vitest's expect
expect.extend(toHaveNoViolations);

// clean up DOM between tests
afterEach(() => {
  cleanup();
});

