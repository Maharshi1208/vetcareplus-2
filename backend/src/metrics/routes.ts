// src/metrics/routes.ts
import { Router } from 'express';
import {
  getSummary,
  getApptsLastNDays,
  getTodayScheduleByVet,
  getRecentActivity,
} from './service.js';
import { authRequired, requireRole } from '../middleware/auth.js';

const r = Router();

// All metrics require a logged-in user
r.use(authRequired);

// Root: minimal OK for CI; admin-only
r.get('/', requireRole('ADMIN'), (_req, res) => {
  // You can return text/JSON if you want; the test accepts 200 or 204.
  res.status(204).send();
});

r.get('/summary', requireRole('ADMIN'), async (_req, res) => {
  const data = await getSummary();
  res.json({ ok: true, data });
});

r.get('/appointments', requireRole('ADMIN'), async (req, res) => {
  const days = Number(req.query.days || 7);
  const data = await getApptsLastNDays(days);
  res.json({ ok: true, data });
});

r.get('/schedule/today', requireRole('ADMIN'), async (_req, res) => {
  const data = await getTodayScheduleByVet();
  res.json({ ok: true, data });
});

r.get('/activity', requireRole('ADMIN'), async (_req, res) => {
  const data = await getRecentActivity(10);
  res.json({ ok: true, data });
});

export default r;
