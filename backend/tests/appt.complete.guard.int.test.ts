import request from "supertest";
import app from "../src/app";
import { prisma } from "../src/lib/db";
import { resetDatabase, disconnect } from "./utils/db";

// ✅ Mock mailer to avoid background console logs after test finishes
jest.mock("../src/lib/mailer", () => ({
  sendApptBooked: jest.fn().mockResolvedValue(undefined),
  sendApptRescheduled: jest.fn().mockResolvedValue(undefined),
  sendApptCancelled: jest.fn().mockResolvedValue(undefined),
}));

function nextWeekdayDate(targetWday: number, hour: number, minute = 0) {
  const d = new Date();
  const diff = (targetWday - d.getDay() + 7) % 7 || 7; // always forward
  d.setDate(d.getDate() + diff);
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function login(email: string, password: string) {
  const res = await request(app).post("/auth/login").send({ email, password });
  expect(res.status).toBe(200);
  return res.body?.tokens?.access || res.body?.accessToken;
}

describe("APPT complete → requires SUCCESS payment", () => {
  let adminToken = "";
  let apptId = "";

  // Extra safety: silence console in this suite
  const origErr = console.error;
  const origLog = console.log;
  const origWarn = console.warn;

  beforeAll(async () => {
    console.error = () => {};
    console.log = () => {};
    console.warn = () => {};

    await resetDatabase();
    adminToken = await login("admin@vetcare.local", "admin123");

    // Create minimal data directly via Prisma
    const owner = await prisma.user.create({
      data: { email: "pay.owner@test.com", passwordHash: "x", role: "OWNER" } as any,
      select: { id: true },
    });

    const pet = await prisma.pet.create({
      data: { name: "PayPet", species: "DOG", ownerId: owner.id },
      select: { id: true },
    });

    const vet = await prisma.vet.create({
      data: { name: "Dr Pay", email: "dr.pay@test.com", specialty: "Gen", active: true },
      select: { id: true },
    });

    await prisma.vetAvailability.create({
      data: { vetId: vet.id, weekday: 2, startMinutes: 9 * 60, endMinutes: 17 * 60 },
    });

    const s = nextWeekdayDate(2, 10, 0);
    const e = nextWeekdayDate(2, 10, 30);

    const appt = await prisma.appointment.create({
      data: { petId: pet.id, vetId: vet.id, start: s, end: e, status: "BOOKED" },
      select: { id: true },
    });
    apptId = appt.id;
  });

  afterAll(async () => {
    console.error = origErr;
    console.log = origLog;
    console.warn = origWarn;
    await disconnect();
  });

  it("fails without payment, then succeeds after SUCCESS payment exists", async () => {
    // 1) Should fail first (no SUCCESS payment yet)
    const bad = await request(app)
      .patch(`/appointments/${apptId}/complete`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(bad.status).toBe(400);

    // 2) Create SUCCESS payment with fields your Prisma model expects
    await prisma.payment.create({
      data: {
        appointmentId: apptId,
        amountCents: 10000,       // required Int
        status: "SUCCESS",        // enum
        currency: "USD",          // include if your schema requires it (harmless if optional)
        method: "CARD",           // include if your schema has it (nullable/optional ok)
        providerRef: "TEST-OK",   // your schema uses providerRef, not provider
        // receiptNo: "R-123",    // add if your schema requires it
      } as any,
    });

    // 3) Now it should pass
    const ok = await request(app)
      .patch(`/appointments/${apptId}/complete`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(ok.status).toBe(200);
    expect(ok.body?.appointment?.status).toBe("COMPLETED");
  });
});
