import { Router } from 'express';
import { authRequired, requireRole } from '../middleware/auth';

const router = Router();

router.get('/ping', authRequired, requireRole('ADMIN'), (_req, res) => {
  res.json({ ok: true, admin: true, msg: 'admin pong' });
});

export default router;
