import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

function PetsList() {
  const [pets, setPets] = React.useState<{id:string;name:string}[]>([]);
  React.useEffect(() => {
    fetch('http://localhost:4000/pets')
      .then(r => r.json())
      .then(setPets)
      .catch(() => setPets([]));
  }, []);
  return (
    <ul>
      {pets.map(p => <li key={p.id}>{p.name}</li>)}
    </ul>
  );
}

describe('PetsList (integration)', () => {
  it('renders pets from API (mocked by MSW)', async () => {
    render(<PetsList />);
    expect(await screen.findByText('Buddy')).toBeInTheDocument();
    expect(await screen.findByText('Misty')).toBeInTheDocument();
  });
});
