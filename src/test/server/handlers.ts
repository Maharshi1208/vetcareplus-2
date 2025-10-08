import { http, HttpResponse } from 'msw';

// Point at your usual API base. MSW will intercept BEFORE real network.
const API_BASE = 'http://localhost:4000';

export const handlers = [
  // --- PETS ---
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

  // --- VETS ---
  // GET /vets
  http.get(`${API_BASE}/vets`, () => {
    return HttpResponse.json({
      data: [
        {
          id: 1,
          firstName: 'Priya',
          lastName: 'Shah',
          email: 'priya.shah@clinic.com',
          phone: '555-800-1111',
          status: 'inactive', // UI shows "Inactive" badge in your screenshot
          specialty: 'Surgery',
        },
        {
          id: 2,
          firstName: 'Marco',
          lastName: 'Lee',
          email: 'marco.lee@clinic.com',
          phone: '555-800-2222',
          status: 'inactive',
          specialty: 'Dentistry',
        },
      ],
      total: 2,
      page: 1,
      pageSize: 25,
    });
  }),

  // GET /vets/select (for dropdowns)
  http.get(`${API_BASE}/vets/select`, () => {
    return HttpResponse.json([
      { value: 1, label: 'Dr. Priya Shah' },
      { value: 2, label: 'Dr. Marco Lee' },
    ]);
  }),

  // --- APPOINTMENTS (Empty state) ---
  // GET /appointments -> returns no data to match current UI
  http.get(`${API_BASE}/appointments`, () => {
    return HttpResponse.json({
      data: [],
      total: 0,
      page: 1,
      pageSize: 25,
    });
  }),
];
