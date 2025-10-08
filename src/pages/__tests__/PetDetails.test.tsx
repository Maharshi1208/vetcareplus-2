// src/pages/__tests__/PetDetails.test.tsx
// ⬇️ Adjust the PetDetails import path if your file lives elsewhere.
import React from 'react';
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/setup';
import { renderWithRouter } from '../../test/utils/renderWithRouter';
import PetDetails from '../PetDetails'; // <-- change if needed

const API_BASE = 'http://localhost:4000';

describe('PetDetails page', () => {
  it('renders pet info when API returns 200', async () => {
    server.use(
      http.get(`${API_BASE}/pets/:id`, ({ params }) =>
        HttpResponse.json({
          id: params.id,
          name: 'Buddy',
          species: 'Dog',
          age: 4,
        })
      )
    );

    renderWithRouter(<PetDetails />, {
      initialEntry: '/pets/pet-1',
      routes: [{ path: '/pets/:id', element: <PetDetails /> }],
    });

    // 🔧 Option A: target the H1 specifically (no "multiple elements" issue)
    expect(
      await screen.findByRole('heading', { name: /Buddy/i })
    ).toBeInTheDocument();

    // Species value assertion (remains a simple text check)
    expect(screen.getByText(/Dog/i)).toBeInTheDocument();
  });

  it('shows Not found on 404', async () => {
    server.use(
      http.get(`${API_BASE}/pets/:id`, ({ params }) =>
        params.id === 'pet-404'
          ? HttpResponse.json({ message: 'Not found' }, { status: 404 })
          : HttpResponse.json({ id: params.id, name: 'X' })
      )
    );

    renderWithRouter(<PetDetails />, {
      initialEntry: '/pets/pet-404',
      routes: [{ path: '/pets/:id', element: <PetDetails /> }],
    });

    expect(await screen.findByText(/not found/i)).toBeInTheDocument();
  });
});
