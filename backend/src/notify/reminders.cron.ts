import cron from 'node-cron';
import { prisma } from '../lib/db.js';
import { sendMail } from '../lib/mailer.js';

const CRON_ENABLED = String(process.env.CRON_ENABLED ?? 'false').toLowerCase() === 'true';
const HOURS_AHEAD = Number(process.env.APPT_REMINDER_HOURS_AHEAD || 24);
const VACCINE_DAYS_AHEAD = Number(process.env.VACCINE_REMINDER_DAYS_AHEAD || 7);

export function startReminders() {
  if (!CRON_ENABLED) {
    console.log('[cron] disabled (set CRON_ENABLED=true to enable)');
    return;
  }

  // Every day at 09:00 server time
  cron.schedule('0 9 * * *', async () => {
    const now = new Date();

    // ---- Appointment reminders (HOURS_AHEAD) ----
    const startA = new Date(now.getTime() + HOURS_AHEAD * 60 * 60 * 1000);
    const endA = new Date(startA.getTime() + 60 * 60 * 1000); // window of an hour

    const appts = await prisma.appointment.findMany({
      where: {
        status: 'BOOKED',
        start: { gte: startA, lt: endA },
      },
      select: {
        id: true,
        start: true,
        pet: {
          select: {
            name: true,
            owner: { select: { email: true, name: true } },
          },
        },
        vet: { select: { name: true } },
      },
    });

    await Promise.all(
      appts.map((a) => {
        const to = a.pet.owner?.email;
        if (!to) return Promise.resolve();
        return sendMail({
          to,
          subject: `Reminder: appointment for ${a.pet.name}`,
          html: `
            <p>Hi ${a.pet.owner?.name ?? ''},</p>
            <p>Reminder: appointment for <b>${a.pet.name}</b> with <b>${a.vet?.name ?? 'our clinic'}</b>.</p>
            <p><b>When:</b> ${a.start.toISOString()}</p>
          `,
          text: `Appointment reminder for ${a.pet.name} at ${a.start.toISOString()}`,
        });
      })
    );

    // ---- Vaccine reminders (due in VACCINE_DAYS_AHEAD) ----
    const soon = new Date(now.getTime() - (365 - VACCINE_DAYS_AHEAD) * 24 * 60 * 60 * 1000);

    const duePets = await prisma.$queryRaw<Array<{ petId: string }>>`
      SELECT DISTINCT ON ("petId") "petId"
      FROM "Vaccination"
      WHERE "givenAt" < ${soon}
      ORDER BY "petId", "givenAt" DESC
    `;

    if (duePets.length) {
      const pets = await prisma.pet.findMany({
        where: { id: { in: duePets.map((d) => d.petId) } },
        select: { name: true, owner: { select: { email: true, name: true } } },
      });

      await Promise.all(
        pets.map((p) => {
          const to = p.owner?.email;
          if (!to) return Promise.resolve();
          return sendMail({
            to,
            subject: `Vaccination due soon for ${p.name}`,
            html: `
              <p>Hi ${p.owner?.name ?? ''},</p>
              <p>It looks like <b>${p.name}</b> may be due for vaccinations soon.</p>
              <p>Please book a visit from your dashboard.</p>
            `,
            text: `Vaccination due soon for ${p.name}`,
          });
        })
      );
    }
  });
}
