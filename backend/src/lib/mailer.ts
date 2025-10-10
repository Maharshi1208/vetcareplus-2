import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

// Normalize env flags (env vars are strings)
const MAIL_ENABLED = String(process.env.MAIL_ENABLED ?? 'true').toLowerCase() === 'true';
const SMTP_SECURE  = String(env.SMTP_SECURE ?? 'false').toLowerCase() === 'true';

// Keep a cached transporter but create it lazily
type MinimalTransporter = Pick<nodemailer.Transporter, 'sendMail'>;
let cachedTransporter: MinimalTransporter | null = null;

/** Test helper to inject a fake transporter (optional for unit tests) */
export function __setTestTransporter(t: MinimalTransporter | null) {
  cachedTransporter = t;
}

function getTransporter(): MinimalTransporter {
  if (cachedTransporter) return cachedTransporter;

  cachedTransporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: Number(env.SMTP_PORT || 587),
    secure: SMTP_SECURE, // <- boolean, no boolean/string comparison
    ...(env.SMTP_USER && env.SMTP_PASS
      ? { auth: { user: env.SMTP_USER, pass: env.SMTP_PASS } }
      : {}),
  });

  return cachedTransporter;
}

function fmt(d: Date) {
  return new Date(d).toLocaleString('en-CA', { hour12: false });
}

// Safe, awaited send (no throw)
async function safeSend(mail: nodemailer.SendMailOptions): Promise<void> {
  if (!MAIL_ENABLED) return;
  try {
    const info = await getTransporter().sendMail({
      from: env.SMTP_FROM,
      ...mail,
    });
    if (!process.env.JEST_WORKER_ID) {
      console.log('mail sent:', (info as any)?.messageId);
    }
  } catch (err) {
    if (!process.env.JEST_WORKER_ID) {
      console.error('sendMail error:', err);
    }
  }
}

export async function sendApptBooked(to: string, pet: string, vet: string, start: Date, end: Date) {
  await safeSend({
    to,
    subject: `Appointment booked for ${pet}`,
    text: `Your appointment with ${vet} is booked.\nStart: ${fmt(start)}\nEnd: ${fmt(end)}`,
    html: `<p>Your appointment with <b>${vet}</b> is booked.<br/>Start: ${fmt(start)}<br/>End: ${fmt(end)}</p>`,
  });
}

export async function sendApptRescheduled(to: string, pet: string, vet: string, start: Date, end: Date) {
  await safeSend({
    to,
    subject: `Appointment rescheduled for ${pet}`,
    text: `Rescheduled with ${vet}.\nStart: ${fmt(start)}\nEnd: ${fmt(end)}`,
    html: `<p>Rescheduled with <b>${vet}</b>.<br/>Start: ${fmt(start)}<br/>End: ${fmt(end)}</p>`,
  });
}

export async function sendApptCancelled(to: string, pet: string, vet: string, start: Date) {
  await safeSend({
    to,
    subject: `Appointment cancelled for ${pet}`,
    text: `Cancelled with ${vet}.\nWas at: ${fmt(start)}`,
    html: `<p>Cancelled with <b>${vet}</b>.<br/>Was at: ${fmt(start)}</p>`,
  });
}

export async function sendPaymentReceipt(to: string, receiptNo: string, amountCents: number, currency: string) {
  const amount = (amountCents / 100).toFixed(2);
  await safeSend({
    to,
    subject: `Receipt ${receiptNo}`,
    text: `Payment received: ${currency} ${amount}\nReceipt: ${receiptNo}`,
    html: `<p>Payment received: <b>${currency} ${amount}</b><br/>Receipt: <code>${receiptNo}</code></p>`,
  });
}

// Generic send (also exported as default)
export async function sendMail(opts: { to: string; subject: string; html?: string; text?: string }) {
  await safeSend(opts);
}
export default sendMail;
