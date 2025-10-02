import request from 'supertest';
import { resetDatabase, disconnect } from './utils/db';
import app from '../src/app';

async function login(email: string, password: string) {
  const r = await request(app).post('/auth/login').send({ email, password });
  return r.body.tokens?.access || r.body.access;
}

const d = (s: string) => new Date(s).toISOString();

describe('INVOICES integration', () => {
  let adminToken = ''; let ownerId = ''; let petId = ''; let vetId = ''; let apptId = '';

  beforeAll(async () => {
    await resetDatabase();
    await request(app).post('/auth/register').send({ email: 'admin@test.com', password: 'secret123', name: 'Admin', role: 'ADMIN' });
    adminToken = await login('admin@test.com', 'secret123');

    const ow = await request(app).post('/owners').set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Owner One', email: 'owner1@test.com', phone: '123-456-7890' });
    ownerId = ow.body.id;

    const pet = await request(app).post('/pets').set('Authorization', `Bearer ${adminToken}`)
      .send({ ownerId, name: 'Buddy', species: 'Dog' });
    petId = pet.body.id;

    const vet = await request(app).post('/vets').set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Dr Vet', email: 'vet1@test.com', yearsOfExperience: 3 });
    vetId = vet.body.id;

    const start = d('2025-10-02T12:00:00Z'); const end = d('2025-10-02T13:00:00Z');
    const appt = await request(app).post('/appointments').set('Authorization', `Bearer ${adminToken}`)
      .send({ ownerId, petId, vetId, start, end });
    apptId = appt.body.id;
  });
  afterAll(async () => { await disconnect(); });

  it('creates invoice from appointment', async () => {
    const res = await request(app).post('/invoices').set('Authorization', `Bearer ${adminToken}`)
      .send({ appointmentId: apptId, items: [{ name: 'Exam', price: 50 }] });
    expect([200,201]).toContain(res.status);
    expect(res.body.id).toBeTruthy();
  });

  it('rejects invalid invoice body', async () => {
    await request(app).post('/invoices').set('Authorization', `Bearer ${adminToken}`)
      .send({}).expect(400);
  });
});
