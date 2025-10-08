// src/pages/__tests__/Owners.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Owners from '../Owners';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock exactly what Owners.tsx imports and expects.
// Return arrays so owners.map(...) works.
vi.mock('../../services/dropdowns', () => {
  return {
    fetchOwnersFull: vi.fn(async () => [
      {
        id: 'owner-1',
        fullName: 'Danny',
        name: 'Danny',              // include both to match whatever the component uses
        email: 'dan@yopmail.com',
        phone: null,
        status: 'active',
        isActive: true,
      },
      {
        id: 'owner-2',
        fullName: 'Gilly Hack',
        name: 'Gilly Hack',
        email: 'gilly.hack@client.local',
        phone: null,
        status: 'active',
        isActive: true,
      },
    ]),
    fetchOwnersSelect: vi.fn(async () => [
      { id: 'owner-1', name: 'Danny' },
      { id: 'owner-2', name: 'Gilly Hack' },
    ]),
  };
});

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('Owners page', () => {
  it('renders owners list from mocked API (200)', async () => {
    renderWithProviders(<Owners />);

    // Wait for actual row text (ensures async data loaded and table body rendered)
    const name1 = await screen.findByText(/Danny/i);
    const name2 = await screen.findByText(/Gilly Hack/i);
    expect(name1).toBeInTheDocument();
    expect(name2).toBeInTheDocument();

    // Ensure the empty state is gone
    expect(screen.queryByText(/No owners found/i)).toBeNull();

    // If the page shows a Total badge/counter, confirm it updates to "2"
    await waitFor(() => {
      const twos = screen.getAllByText('2');
      expect(twos.length).toBeGreaterThan(0);
    });
  });
});
