import request from 'supertest';
import app from '../src/app';
import { resetDatabase, disconnect } from './utils/db';
import { loginAsAdmin, mustExtractId } from './utils/login';

describe('VET availability edges', () => {
  let admin: string;
  let vetId: string;

  beforeAll(async () => {
    await resetDatabase();
    admin = await loginAsAdmin(app);

    const vr = await request(app)
      .post('/vets')
      .set('Authorization', `Bearer ${admin}`)
      .send({ name: 'Dr Edge' })
      .expect(201);

    vetId = mustExtractId(vr.body, 'vet');
    expect(typeof vetId).toBe('string');
  });

  afterAll(disconnect);

  it('allows adjacent slots (10:00–11:00) and (11:00–12:00)', async () => {
    const weekday = 3; // Wed

    await request(app)
      .post(`/vets/${vetId}/availability`)
      .set('Authorization', `Bearer ${admin}`)
      .send({ weekday, start: '10:00', end: '11:00' })
      .expect([200, 201]);

    await request(app)
      .post(`/vets/${vetId}/availability`)
      .set('Authorization', `Bearer ${admin}`)
      .send({ weekday, start: '11:00', end: '12:00' })
      .expect([200, 201]);
  });

  it('rejects invalid range (end <= start or midnight wrap)', async () => {
    const weekday = 4; // Thu

    const bad = await request(app)
      .post(`/vets/${vetId}/availability`)
      .set('Authorization', `Bearer ${admin}`)
      .send({ weekday, start: '23:00', end: '01:00' }) // wraps past midnight → invalid
      .expect(400);

    // any hint about invalid range in the message is fine
    expect(JSON.stringify(bad.body)).toMatch(/invalid|range|after/i);
  });
});
