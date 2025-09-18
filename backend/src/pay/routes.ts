// backend/src/pay/routes.ts
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/db.js';
import { authRequired, AuthedRequest } from '../middleware/auth.js';
import { sendPaymentReceipt } from '../lib/mailer.js';

const router = Router();

const isAdmin = (req: AuthedRequest) => req.user?.role === 'ADMIN';

async function canUseAppointment(req: AuthedRequest, apptId: string) {
  if (isAdmin(req)) return true;
  const appt = await prisma.appointment.findUnique({
    where: { id: apptId },
    select: { pet: { select: { ownerId: true } } }
  });
  return !!appt && appt.pet.ownerId === req.user!.sub;
}

function makeReceiptNo() {
  const rand = Math.random().toString(36).slice(-6).toUpperCase();
  return `RCT-${Date.now()}-${rand}`;
}

const checkoutSchema = z.object({
  appointmentId: z.string().cuid(),
  amountCents: z.number().int().positive(),
  currency: z.string().default('CAD'),
  method: z.string().optional(),
  simulate: z.enum(['SUCCESS', 'FAILED']),
});

// POST /pay/checkout
router.post('/checkout', authRequired, async (req: AuthedRequest, res) => {
  const parsed = checkoutSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.flatten() });
  }

  const { appointmentId, amountCents, currency, method, simulate } = parsed.data;

  if (!(await canUseAppointment(req, appointmentId))) {
    return res.status(403).json({ ok: false, error: 'Forbidden: not your appointment' });
  }

  const appt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: {
      id: true,
      status: true,
      pet: { select: { name: true, ownerId: true } },
      vet: { select: { name: true } },
      start: true,
      end: true
    }
  });

  if (!appt) return res.status(404).json({ ok: false, error: 'Appointment not found' });
  if (appt.status !== 'BOOKED') {
    return res.status(400).json({ ok: false, error: 'Only BOOKED appts can be paid' });
  }

  const existingSuccess = await prisma.payment.findFirst({
    where: { appointmentId, status: 'SUCCESS' },
    select: { id: true }
  });
  if (existingSuccess) {
    return res.status(409).json({ ok: false, error: 'Payment already captured for this appointment' });
  }

  const payment = await prisma.payment.create({
    data: {
      appointmentId,
      amountCents,
      currency,
      status: simulate === 'SUCCESS' ? 'SUCCESS' : 'FAILED',
      method,
      providerRef: `MOCK-${Math.random().toString(36).slice(2, 8)}`,
      receiptNo: simulate === 'SUCCESS' ? makeReceiptNo() : null,
    },
  });

  if (payment.status === 'FAILED') {
    return res.status(402).json({ ok: false, error: 'Payment failed', payment });
  }

  // Fire-and-forget receipt email to the owner (safe: logs on failure)
  try {
    const owner = await prisma.user.findUnique({
      where: { id: appt!.pet.ownerId },
      select: { email: true },
    });
    if (owner?.email && payment.receiptNo) {
      // NOTE: sendPaymentReceipt expects (to, receiptNo, amountCents, currency)
      void sendPaymentReceipt(owner.email, payment.receiptNo, payment.amountCents, payment.currency);
    }
  } catch (e) {
    // mail send errors are already logged in mailer
  }

  return res.status(201).json({
    ok: true,
    payment,
    receipt: {
      receiptNo: payment.receiptNo,
      appointmentId: appt.id,
      petName: appt.pet.name,
      vetName: appt.vet.name,
      start: appt.start,
      end: appt.end,
      amountCents: payment.amountCents,
      currency: payment.currency,
      method: payment.method ?? 'CARD',
      createdAt: payment.createdAt,
      note: 'Mock receipt (non-binding)',
    },
  });
});

// GET /pay/appointment/:appointmentId — list payments for an appointment
router.get('/appointment/:appointmentId', authRequired, async (req: AuthedRequest, res) => {
  const { appointmentId } = req.params;
  if (!(await canUseAppointment(req, appointmentId))) {
    return res.status(403).json({ ok: false, error: 'Forbidden' });
  }
  const rows = await prisma.payment.findMany({
    where: { appointmentId },
    orderBy: { createdAt: 'desc' }
  });
  res.json({ ok: true, payments: rows });
});

// GET /pay/receipt/:paymentId — fetch a receipt for a SUCCESS payment
router.get('/receipt/:paymentId', authRequired, async (req: AuthedRequest, res) => {
  const pay = await prisma.payment.findUnique({
    where: { id: req.params.paymentId },
    include: { appointment: { include: { pet: true, vet: true } } }
  });

  if (!pay) return res.status(404).json({ ok: false, error: 'Not found' });
  if (!isAdmin(req) && pay.appointment.pet.ownerId !== req.user!.sub) {
    return res.status(403).json({ ok: false, error: 'Forbidden' });
  }
  if (pay.status !== 'SUCCESS') {
    return res.status(400).json({ ok: false, error: 'No receipt for non-successful payment' });
  }

  res.json({
    ok: true,
    receipt: {
      receiptNo: pay.receiptNo,
      appointmentId: pay.appointmentId,
      petName: pay.appointment.pet.name,
      vetName: pay.appointment.vet.name,
      start: pay.appointment.start,
      end: pay.appointment.end,
      amountCents: pay.amountCents,
      currency: pay.currency,
      method: pay.method ?? 'CARD',
      createdAt: pay.createdAt,
      providerRef: pay.providerRef,
      note: 'Mock receipt (non-binding)',
    }
  });
});

export default router;
