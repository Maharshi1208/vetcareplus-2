import React, { PropsWithChildren } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render } from '@testing-library/react';

type RouteDef = { path: string; element: React.ReactElement };

export function renderWithRouter(
  ui: React.ReactElement,
  {
    initialEntry = '/',
    routes = [] as RouteDef[],
  } = {},
) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        {routes.map(r => (
          <Route key={r.path} path={r.path} element={r.element} />
        ))}
        {/* Fallback route to render the subject UI if it's already a Route Element */}
        <Route path="*" element={ui} />
      </Routes>
    </MemoryRouter>
  );
}
