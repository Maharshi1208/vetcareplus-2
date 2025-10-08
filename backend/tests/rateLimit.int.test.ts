// tests/rateLimit.int.test.ts
import express from 'express'
import rateLimit from 'express-rate-limit'
import request from 'supertest'
import { resetDatabase, disconnect } from './utils/db'

describe('Rate limiting', () => {
  beforeAll(async () => { await resetDatabase() })
  afterAll(async () => { await disconnect() })

  it(
    'eventually returns 429 under sustained load',
    async () => {
      const app = express()

      // Very small window/limit so the test trips 429 quickly
      const limiter = rateLimit({
        windowMs: 1500,     // 1.5s window
        limit: 40,          // allow 40 reqs per window per IP
        standardHeaders: true,
        legacyHeaders: false,
      })
      app.use(limiter)
      app.get('/ping', (_req, res) => res.send('pong'))

      const clientIp = '203.0.113.77'
      let got429 = false

      // Up to 300 sequential hits should exceed the 40-per-1.5s cap
      for (let i = 0; i < 300 && !got429; i++) {
        const res = await request(app).get('/ping').set('X-Forwarded-For', clientIp)
        if (res.status === 429) got429 = true
      }

      expect(got429).toBe(true)
    },
    15000
  )
})
