import request from 'supertest'
import app from '../src/app'
import { resetDatabase, disconnect } from './utils/db'

describe('Rate limiting', () => {
  beforeAll(async () => { await resetDatabase() })
  afterAll(async () => { await disconnect() })

  it('eventually returns 429 when hammering a public endpoint', async () => {
    // /ping is public and cheap
    const attempts = 120
    let got429 = false

    for (let i = 0; i < attempts; i++) {
      const res = await request(app).get('/ping')
      if (res.status === 429) { got429 = true; break }
    }
    expect(got429).toBe(true)
  })
})
