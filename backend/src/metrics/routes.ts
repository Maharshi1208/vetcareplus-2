// src/metrics/routes.ts
import { Router } from 'express';
import { getSummary, getApptsLastNDays, getTodayScheduleByVet, getRecentActivity } from './service.js';
import { authRequired } from '../middleware/auth.js'; // use your real auth

const r = Router();

// all metrics require a logged-in user (ADMIN/OWNER/VET)
r.use(authRequired);

r.get('/summary', async (_req, res) => {
  const data = await getSummary();
  res.json({ ok: true, data });
});

r.get('/appointments', async (req, res) => {
  const days = Number(req.query.days || 7);
  const data = await getApptsLastNDays(days);
  res.json({ ok: true, data });
});

r.get('/schedule/today', async (_req, res) => {
  const data = await getTodayScheduleByVet();
  res.json({ ok: true, data });
});

r.get('/activity', async (_req, res) => {
  const data = await getRecentActivity(10);
  res.json({ ok: true, data });
});

export default r;
