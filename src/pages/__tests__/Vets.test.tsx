// src/pages/__tests__/Vets.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Vets from '../Vets';

// Make the page think an admin is logged in
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { role: 'admin', id: 'test-admin' },
    token: 'test-token',
    isAuthenticated: true,
    setAuth: vi.fn(),
    logout: vi.fn(),
  }),
}));

// Mock exactly what Vets.tsx calls and return the shape it renders:
// IMPORTANT: include `name` so the "Name" column isn't blank.
vi.mock('../../services/vets', () => ({
  listVets: vi.fn().mockResolvedValue([
    {
      id: 1,
      name: 'Priya Shah',            // <-- add this
      firstName: 'Priya',
      lastName: 'Shah',
      email: 'priya.shah@clinic.com',
      phone: '555-800-1111',
      specialty: 'Surgery',
      active: false,                 // status badge logic may use a boolean
      status: 'inactive',            // include if your UI reads a string instead
    },
    {
      id: 2,
      name: 'Marco Lee',             // <-- add this
      firstName: 'Marco',
      lastName: 'Lee',
      email: 'marco.lee@clinic.com',
      phone: '555-800-2222',
      specialty: 'Dentistry',
      active: false,
      status: 'inactive',
    },
  ]),
}));

describe('Vets page', () => {
  it('renders vets list from mocked API (200)', async () => {
    render(
      <MemoryRouter initialEntries={['/vets']}>
        <Routes>
          <Route path="/vets" element={<Vets />} />
        </Routes>
      </MemoryRouter>
    );

    // Name column now populated via `name`
    expect(await screen.findByText(/Priya Shah/i)).toBeInTheDocument();
    expect(screen.getByText(/priya\.shah@clinic\.com/i)).toBeInTheDocument();
    expect(screen.getByText(/555-800-1111/i)).toBeInTheDocument();

    expect(screen.getByText(/Marco Lee/i)).toBeInTheDocument();
    expect(screen.getByText(/marco\.lee@clinic\.com/i)).toBeInTheDocument();
    expect(screen.getByText(/555-800-2222/i)).toBeInTheDocument();
  });
});
