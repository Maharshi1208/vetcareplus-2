import request from 'supertest'
import app from '../src/app'
import { resetDatabase, disconnect } from './utils/db'

describe('Health & Docs', () => {
  beforeAll(async () => { await resetDatabase() })
  afterAll(async () => { await disconnect() })

  it('GET / returns a banner', async () => {
    const res = await request(app).get('/')
    expect(res.status).toBe(200)
    expect(res.text).toMatch(/VetCare\+ API is running/i)
  })

  it('GET /health returns uptime & timestamp', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('ok', true)
    expect(res.body).toHaveProperty('uptime')
    expect(res.body).toHaveProperty('timestamp')
  })

  it('GET /health/db confirms Prisma connectivity', async () => {
    const res = await request(app).get('/health/db')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('ok', true)
  })

  it('OpenAPI JSON is served', async () => {
    const res = await request(app).get('/docs/openapi.json')
    expect(res.status).toBe(200)
    expect(res.body).toBeTruthy()
    // spot-check a couple of expected top-level keys
    expect(res.body.info || res.body.openapi).toBeTruthy()
  })
})
