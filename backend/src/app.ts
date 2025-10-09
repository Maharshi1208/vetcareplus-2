// backend/src/app.ts
// Load .env.test for tests, .env for everything else
import { config as loadEnv } from 'dotenv';
loadEnv({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env' });

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { env } from './config/env.js';
import { rateLimiter } from './middleware/rateLimit.js';
import { prisma } from './lib/db.js';

import reportRoutes from './report/routes.js';
import payRoutes from './pay/routes.js';
import apptRoutes from './appt/routes.js';
import vetRoutes from './vet/routes.js';
import petRoutes from './pet/routes.js';        // ✅ singular "pet"
import adminRoutes from './admin/routes.js';
import authRoutes from './auth/routes.js';
import swaggerUi from 'swagger-ui-express';
import { getSpec } from './docs/openapi.js';
import notifyRoutes from './notify/notify.routes.js';
import metricsRoutes from './metrics/routes.js';
import ownersRoutes from './owner/routes.js';

// ✅ Health routes (vaccinations/medications/timeline)
import healthRoutes from './health/routes.js';

// RBAC helpers only used inside specific routes (not globally here)
import { authRequired, requireRole } from './middleware/auth.js';
import type { AuthedRequest } from './middleware/auth.js';

const app = express();

/** OpenAPI JSON + Swagger UI */
app.get('/docs/openapi.json', (_req, res) => {
  res.json(getSpec());
});
app.use(
  '/docs',
  swaggerUi.serve,
  swaggerUi.setup(undefined, {
    swaggerOptions: { url: '/docs/openapi.json' },
    customSiteTitle: 'VetCare+ API Docs',
  })
);

/** Security & infra */
app.use(helmet());
app.use(rateLimiter);
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

/** Basic health */
app.get('/', (_req, res) => res.send('VetCare+ API is running'));
app.get('/ping', (_req, res) =>
  res.json({ ok: true, pong: new Date().toISOString() })
);
app.get('/health', (_req, res) =>
  res
    .status(200)
    .json({ ok: true, uptime: process.uptime(), timestamp: new Date().toISOString() })
);

/** DB health via Prisma */
app.get('/health/db', async (_req, res) => {
  try {
    const r = await prisma.$queryRaw<{ ok: number }[]>`SELECT 1 AS ok`;
    res.status(200).json({ ok: Array.isArray(r) && r[0]?.ok === 1 });
  } catch (err) {
    console.error('DB health error:', err);
    res.status(500).json({ ok: false, error: 'DB not reachable' });
  }
});

/** Dev-only sanity endpoints */
if (env.NODE_ENV !== 'production') {
  app.get('/whoami', authRequired, (req, res) => {
    const user = (req as AuthedRequest).user;
    res.json({ ok: true, user });
  });

  app.get('/admin/ping', authRequired, requireRole('ADMIN'), (_req, res) => {
    res.json({ ok: true, scope: 'ADMIN' });
  });
}

/**
 * ROUTES
 * Keep /auth PUBLIC (no authRequired here). All other routers do their own per-route guards.
 */
app.use('/auth', authRoutes);

app.use('/admin', adminRoutes);
app.use('/owners', ownersRoutes);
app.use('/pets', petRoutes);             // ✅ pets endpoints
app.use('/vets', vetRoutes);
app.use('/appointments', apptRoutes);
app.use('/pay', payRoutes);
app.use('/reports', reportRoutes);
app.use('/notify', notifyRoutes);
app.use('/metrics', metricsRoutes);

// ✅ Health endpoints (no prefix):
//    POST /vaccinations
//    GET  /vaccinations?petId=...
//    POST /medications
//    GET  /medications?petId=...
//    GET  /pets/:petId/health
app.use(healthRoutes);

/** 404 + error handler */
app.use((_req, res) => res.status(404).json({ ok: false, error: 'Not found' }));
app.use(
  (err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Internal Server Error' });
  }
);

export default app;
