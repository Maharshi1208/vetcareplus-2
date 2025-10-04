import request from 'supertest';
import app from '../src/app';
import { resetDatabase, disconnect } from './utils/db';
import {
  loginAsAdmin,
  mustExtractId,
  register,
  mustExtractToken,
} from './utils/login';

describe('APPT race booking', () => {
  let admin: string;
  let ownerToken: string;
  let petId: string;
  let vetId: string;

  beforeAll(async () => {
    await resetDatabase();
    admin = await loginAsAdmin(app);

    // Create a normal user and get a token
    await register(app, { email: 'race@test.com', password: 'race1234', name: 'Racer' });
    const lr = await request(app)
      .post('/auth/login')
      .send({ email: 'race@test.com', password: 'race1234' })
      .expect(200);
    ownerToken = mustExtractToken(lr.body);

    // Create a pet for that user (admin creates)
    const pr = await request(app)
      .post('/pets')
      .set('Authorization', `Bearer ${admin}`)
      .send({ ownerEmail: 'race@test.com', name: 'Bolt' })
      .expect(201);
    petId = mustExtractId(pr.body, 'pet');

    // Create a vet
    const vr = await request(app)
      .post('/vets')
      .set('Authorization', `Bearer ${admin}`)
      .send({ name: 'Dr Fast' })
      .expect(201);
    vetId = mustExtractId(vr.body, 'vet');

    // Availability for tomorrow 09:00–10:00 UTC
    const tomorrow = new Date();
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const weekday = tomorrow.getUTCDay();

    await request(app)
      .post(`/vets/${vetId}/availability`)
      .set('Authorization', `Bearer ${admin}`)
      .send({ weekday, start: '09:00', end: '10:00' })
      .expect([200, 201]);
  });

  afterAll(disconnect);

  it('two simultaneous bookings yield at most one success (rest conflicts)', async () => {
    // tomorrow 09:00–09:30 UTC
    const start = new Date();
    start.setUTCDate(start.getUTCDate() + 1);
    start.setUTCHours(9, 0, 0, 0);

    const end = new Date(start);
    end.setUTCMinutes(end.getUTCMinutes() + 30);

    const body = { petId, vetId, start: start.toISOString(), end: end.toISOString() };

    // Use admin to avoid RBAC noise; we only care about race/conflict
    const mk = () =>
      request(app)
        .post('/appointments')
        .set('Authorization', `Bearer ${admin}`)
        .send(body);

    const [a, b] = await Promise.all([mk(), mk()]);
    const codes = [a.status, b.status];

    const successes = codes.filter((s) => s === 200 || s === 201).length;
    const conflicts = codes.filter((s) => s === 409).length;
    const unexpected = codes.filter((s) => ![200, 201, 409].includes(s));

    expect(unexpected).toHaveLength(0);
    // Accept either:
    //  - 1 success + 1 conflict (ideal), or
    //  - 0 success + 2 conflicts (backend short-circuits or locks)
    expect([[1, 1], [0, 2]]).toContainEqual([successes, conflicts]);
  });
});
