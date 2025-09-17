import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { env } from './config/env';
import { rateLimiter } from './middleware/rateLimit';
import { prisma } from './lib/db';

import reportRoutes from './report/routes';
import payRoutes from './pay/routes';
import apptRoutes from './appt/routes';
import vetRoutes from './vet/routes';
import petRoutes from './pet/routes';
import adminRoutes from './admin/routes';
import authRoutes from './auth/routes';

const app = express();

/** Security & infra */
app.use(helmet());
app.use(rateLimiter);
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

/** Basic health */
app.get('/', (_req, res) => res.send('VetCare+ API is running'));
app.get('/ping', (_req, res) => res.json({ ok: true, pong: new Date().toISOString() }));
app.get('/health', (_req, res) =>
  res.status(200).json({ ok: true, uptime: process.uptime(), timestamp: new Date().toISOString() })
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

/** Routes */
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/pets', petRoutes);
app.use('/vets', vetRoutes);
app.use('/appointments', apptRoutes);
app.use('/pay', payRoutes);
app.use('/reports', reportRoutes);

/** 404 + error handler */
app.use((_req, res) => res.status(404).json({ ok: false, error: 'Not found' }));
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ ok: false, error: 'Internal Server Error' });
});

/** Start */
app.listen(env.PORT, () =>
  console.log(`VetCare+ API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`)
);
