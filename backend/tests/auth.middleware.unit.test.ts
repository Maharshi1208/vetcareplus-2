// tests/auth.middleware.unit.test.ts
import express from 'express'
import request from 'supertest'
import path from 'path'

// --- utils -------------------------------------------------------------

function tryResolve(spec: string): string | null {
  try { return require.resolve(spec) } catch { return null }
}

function resolveFromDir(dir: string, spec: string): string | null {
  try { return require.resolve(spec, { paths: [dir] as any }) } catch { return null }
}

function mustResolveOne(...candidates: string[]): string {
  for (const c of candidates) {
    const r = tryResolve(c)
    if (r) return r
  }
  throw new Error(`Could not resolve any of: ${candidates.join(', ')}`)
}

// --- find the middleware file -----------------------------------------

const MW_PATH = mustResolveOne(
  '../src/middleware/authRequired',
  '../src/middleware/auth',
  '../src/middlewares/authRequired',
  '../src/http/middleware/authRequired',
)

// --- build app with a specific jwt mock --------------------------------

type VerifyImpl = (token: string, expectedType?: string) => any

function buildAppWithJwtMock(impl: VerifyImpl) {
  jest.resetModules()

  const mwDir = path.dirname(MW_PATH)

  // Try the common compiled import spellings from the middleware's directory
  const jwtAbsIds = new Set<string>()
  for (const rel of [
    '../lib/jwt',
    '../lib/jwt.js',
    '../../lib/jwt',
    '../../lib/jwt.js',
    '../../../lib/jwt',
    '../../../lib/jwt.js',
  ]) {
    const abs = resolveFromDir(mwDir, rel)
    if (abs) jwtAbsIds.add(abs)
  }

  // If none of those hit, also try resolving the src/lib/jwt directly and mock by abs path
  const fallbackAbs = tryResolve('../src/lib/jwt')
  if (fallbackAbs) jwtAbsIds.add(fallbackAbs)

  if (jwtAbsIds.size === 0) {
    throw new Error('Could not resolve the jwt module used by the middleware')
  }

  // Provide a rich mock with multiple export names & default
  const factory = () => {
    const fn = jest.fn<ReturnType<VerifyImpl>, Parameters<VerifyImpl>>(impl)
    return {
      __esModule: true as const,
      // common names a middleware might call
      verifyJwt: fn,
      verifyAccessToken: fn,
      verifyToken: fn,
      default: { verifyJwt: fn, verifyAccessToken: fn, verifyToken: fn },
    }
  }

  for (const id of jwtAbsIds) {
    jest.doMock(id, factory)
  }

  // Now load the middleware AFTER mocks are registered
  let authRequired: any
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require(MW_PATH)
    authRequired = mod.authRequired || mod.default || mod
  })

  const app = express()
  app.get('/protected', authRequired, (_req, res) => res.json({ ok: true }))
  return app
}

// --- tests -------------------------------------------------------------

describe('authRequired middleware', () => {
  it('401 when header missing', async () => {
    const app = buildAppWithJwtMock(() => { throw new Error('no token') })
    await request(app).get('/protected').expect(401)
  })

  it('401 when header malformed', async () => {
    const app = buildAppWithJwtMock(() => { throw new Error('bad header') })
    await request(app).get('/protected').set('Authorization', 'Bad token').expect(401)
  })

  it('401 when token invalid', async () => {
    const app = buildAppWithJwtMock((token) => {
      if (token === 'not-a-token') throw new Error('invalid token')
      return { sub: 'u1', role: 'USER', type: 'access' }
    })
    await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer not-a-token')
      .expect(401)
  })

  it('200 when token valid', async () => {
    const app = buildAppWithJwtMock((token, expectedType) => {
      if (token !== 'real-token') throw new Error('invalid token')
      // include a bunch of fields to satisfy strict checks
      return {
        sub: 'user-1',
        userId: 'user-1',
        role: 'USER',
        scope: 'access',
        typ: expectedType || 'access',
        type: expectedType || 'access',
        tokenType: (expectedType || 'access').toUpperCase(),
        iat: Math.floor(Date.now() / 1000) - 10,
        exp: Math.floor(Date.now() / 1000) + 3600,
      }
    })

    await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer real-token')
      .expect(200)
  })
})
