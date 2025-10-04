import request from 'supertest'
import app from '../src/app'
import { resetDatabase, disconnect } from './utils/db'
import { loginAsAdmin } from './utils/login'

const getToken = (r: any) => r.body?.tokens?.access || r.body?.access

describe('RBAC / admin-only access', () => {
  beforeAll(async () => { await resetDatabase() })
  afterAll(async () => { await disconnect() })

  it('admin can hit /admin/ping; non-admin gets 403', async () => {
    const adminToken: string = await loginAsAdmin(app)

    const email = 'rbac1@test.com'
    const password = 'secret123'
    await request(app).post('/auth/register').send({ email, password, name: 'RBAC One' }).expect(201)
    const login = await request(app).post('/auth/login').send({ email, password }).expect(200)
    const userToken = getToken(login)

    await request(app).get('/admin/ping').set('Authorization', `Bearer ${adminToken}`).expect(200)
    await request(app).get('/admin/ping').set('Authorization', `Bearer ${userToken}`).expect(403)
  })

  it('only admin can create a vet', async () => {
    const adminToken: string = await loginAsAdmin(app)

    const email = 'rbac2@test.com'
    const password = 'secret123'
    await request(app).post('/auth/register').send({ email, password, name: 'RBAC Two' }).expect(201)
    const login = await request(app).post('/auth/login').send({ email, password }).expect(200)
    const userToken = getToken(login)

    await request(app)
      .post('/vets')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Dr. RBAC', email: 'dr.rbac@test.com' })
      .expect([200, 201])

    await request(app)
      .post('/vets')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Dr. Nope', email: 'nope@test.com' })
      .expect(403)
  })
})
