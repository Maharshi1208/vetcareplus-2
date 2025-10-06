import { http, HttpResponse } from 'msw';

// Point at your usual API base. MSW will intercept BEFORE real network.
const API_BASE = 'http://localhost:4000';

export const handlers = [
  // GET /pets
  http.get(`${API_BASE}/pets`, () => {
    return HttpResponse.json([
      { id: 'pet-1', name: 'Buddy' },
      { id: 'pet-2', name: 'Misty' },
    ]);
  }),

  // GET /pets/:id
  http.get(`${API_BASE}/pets/:id`, ({ params }) => {
    const id = String(params.id);
    if (id === 'pet-404') {
      return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    }
    return HttpResponse.json({ id, name: 'Buddy', species: 'Dog', age: 4 });
  }),
];
