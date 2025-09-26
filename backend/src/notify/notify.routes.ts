import { Router } from 'express';
import nodemailer from 'nodemailer';
import { isDocker } from '../lib/isDocker.js'; // ESM: note the .js on import after build

const router = Router();

// Auto-pick host if not provided in env:
const defaultSmtpHost = isDocker() ? 'mailhog' : '127.0.0.1';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || defaultSmtpHost,
  port: Number(process.env.SMTP_PORT || 1025),
  secure: false,
});

router.get('/test', async (req, res) => {
  try {
    const to = (req.query.to as string) || 'test@local.test';
    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM || 'VetCare+ <no-reply@vetcare.local>',
      to,
      subject: 'VetCare+ Mail Test',
      text: 'This is a test email from VetCare+.',
    });
    res.json({ ok: true, messageId: info.messageId });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message || 'send failed' });
  }
});

export default router;
