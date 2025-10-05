import request from 'supertest';
import app from '../src/app';
import { resetDatabase, disconnect } from './utils/db';
import { loginAsAdmin, mustExtractId } from './utils/login';

describe('VETS /select + active flag', () => {
  let admin: string;
  let vetA: string;
  let vetB: string;
  let vetC: string;

  beforeAll(async () => {
    await resetDatabase();
    admin = await loginAsAdmin(app);

    const rA = await request(app).post('/vets').set('Authorization', `Bearer ${admin}`).send({ name: 'Alpha Vet' }).expect(201);
    const rB = await request(app).post('/vets').set('Authorization', `Bearer ${admin}`).send({ name: 'Beta Vet' }).expect(201);
    const rC = await request(app).post('/vets').set('Authorization', `Bearer ${admin}`).send({ name: 'Charlie Vet' }).expect(201);
    vetA = mustExtractId(rA.body, 'vet');
    vetB = mustExtractId(rB.body, 'vet');
    vetC = mustExtractId(rC.body, 'vet');
  });

  afterAll(disconnect);

  it('returns ordered active vets', async () => {
    const res = await request(app).get('/vets/select').set('Authorization', `Bearer ${admin}`).expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    const names = res.body.map((v: any) => v.name);
    // sorted asc: Alpha, Beta, Charlie
    expect(names).toEqual(['Alpha Vet', 'Beta Vet', 'Charlie Vet']);
  });

  it('inactive vets are hidden from /select', async () => {
    // deactivate Beta
    await request(app).patch(`/vets/${vetB}`).set('Authorization', `Bearer ${admin}`).send({ active: false }).expect(200);

    const res = await request(app).get('/vets/select').set('Authorization', `Bearer ${admin}`).expect(200);
    const names = res.body.map((v: any) => v.name);
    expect(names).toEqual(['Alpha Vet', 'Charlie Vet']);
    // also ensure the ids returned match only A & C
    const ids = res.body.map((v: any) => v.id);
    expect(ids).toEqual(expect.arrayContaining([vetA, vetC]));
    expect(ids).not.toEqual(expect.arrayContaining([vetB]));
  });
});
