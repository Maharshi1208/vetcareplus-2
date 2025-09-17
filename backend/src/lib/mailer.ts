import nodemailer from 'nodemailer';

const MAIL_HOST = process.env.MAIL_HOST || 'localhost';
const MAIL_PORT = Number(process.env.MAIL_PORT || 1025);
const MAIL_FROM = process.env.MAIL_FROM || 'VetCare+ <no-reply@vetcare.local>';

export const transporter = nodemailer.createTransport({
  host: MAIL_HOST,
  port: MAIL_PORT,
  secure: false,
});

type SendArgs = { to: string; subject: string; text?: string; html?: string };
export async function sendMail({ to, subject, text, html }: SendArgs) {
  try {
    await transporter.sendMail({ from: MAIL_FROM, to, subject, text, html });
  } catch (err) {
    console.error('sendMail error:', err);
  }
}

export const fmtDate = (d: Date) => new Date(d).toLocaleString();

export async function sendApptBooked(to: string, pet: string, vet: string, start: Date, end: Date) {
  const subject = `Appointment booked for ${pet}`;
  const text = `Hi,

Your appointment has been booked:
Pet: ${pet}
Vet: ${vet}
Start: ${fmtDate(start)}
End: ${fmtDate(end)}

— VetCare+`;
  await sendMail({ to, subject, text });
}

export async function sendApptRescheduled(to: string, pet: string, vet: string, start: Date, end: Date) {
  const subject = `Appointment rescheduled for ${pet}`;
  const text = `Hi,

Your appointment has been rescheduled:
Pet: ${pet}
Vet: ${vet}
New Start: ${fmtDate(start)}
New End: ${fmtDate(end)}

— VetCare+`;
  await sendMail({ to, subject, text });
}

export async function sendApptCancelled(to: string, pet: string, vet: string, original: Date) {
  const subject = `Appointment cancelled for ${pet}`;
  const text = `Hi,

Your appointment was cancelled:
Pet: ${pet}
Vet: ${vet}
Original Start: ${fmtDate(original)}

— VetCare+`;
  await sendMail({ to, subject, text });
}

export async function sendPaymentReceipt(
  to: string, pet: string, vet: string, start: Date,
  amountCents: number, currency: string, receiptNo: string
) {
  const amount = (amountCents / 100).toFixed(2) + ' ' + currency;
  const subject = `Receipt ${receiptNo} — ${pet}`;
  const text = `Hi,

Payment successful.
Receipt: ${receiptNo}
Pet: ${pet}
Vet: ${vet}
Appointment: ${fmtDate(start)}
Amount: ${amount}

— VetCare+`;
  await sendMail({ to, subject, text });
}
