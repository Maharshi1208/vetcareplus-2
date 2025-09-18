// backend/src/lib/mailer.ts
import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,           // in Docker: "mailhog" (from compose)
  port: env.SMTP_PORT,           // 1025 for MailHog
  secure: env.SMTP_SECURE,       // false for MailHog
  ...(env.SMTP_USER && env.SMTP_PASS
    ? { auth: { user: env.SMTP_USER, pass: env.SMTP_PASS } }
    : {}),
});

function fmt(d: Date) {
  return new Date(d).toLocaleString('en-CA', { hour12: false });
}

// Fire-and-forget wrapper (logs but never throws)
async function safeSend(mail: nodemailer.SendMailOptions) {
  try {
    const info = await transporter.sendMail({ from: env.SMTP_FROM, ...mail });
    console.log('mail sent:', info.messageId);
  } catch (err) {
    console.error('sendMail error:', err);
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
