// backend/src/notify/notify.routes.ts
import { Router } from 'express';
import { sendMail } from '../lib/mailer.js';

const router = Router();

router.get('/test', async (req, res) => {
  try {
    const to = (req.query.to as string) || 'test@local.test';
    await sendMail({
      to,
      subject: 'VetCare+ Mail Test',
      text: 'This is a test email from VetCare+.',
      html: '<p>This is a test email from <b>VetCare+</b>.</p>',
    });
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message || 'send failed' });
  }
});

export default router;
