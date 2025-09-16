import 'dotenv/config';
import authRoutes from "./auth/routes";
import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';

const PORT = Number(process.env.PORT || 4000);
const ORIGIN = process.env.CORS_ORIGIN || '*';
const DATABASE_URL = process.env.DATABASE_URL as string;

const app = express();
app.use(cors({ origin: ORIGIN }));
app.use(express.json());

app.get('/', (_req, res) => res.send('VetCare+ API is running'));

app.get('/ping', (_req, res) => {
  res.json({ ok: true, pong: new Date().toISOString() });
});

app.get('/health', (_req, res) => {
  res.status(200).json({
    ok: true,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

const pool = new Pool({ connectionString: DATABASE_URL });
app.get('/health/db', async (_req, res) => {
  try {
    const r = await pool.query('SELECT 1 AS ok');
    res.status(200).json({ ok: r?.rows?.[0]?.ok === 1 });
  } catch (err) {
    console.error('DB health error:', err);
    res.status(500).json({ ok: false, error: 'DB not reachable' });
  }
});

app.use('/auth', authRoutes);
app.listen(PORT, () => console.log(`VetCare+ API listening on http://localhost:${PORT}`));
