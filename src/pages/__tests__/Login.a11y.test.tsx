// src/pages/__tests__/Login.a11y.test.tsx
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { MemoryRouter } from 'react-router-dom';
import Login from '../Login';

describe('Login accessibility', () => {
  it('has no obvious a11y violations', async () => {
    const { container } = render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
