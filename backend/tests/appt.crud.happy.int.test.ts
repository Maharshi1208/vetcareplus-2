import request from "supertest";
import app from "../src/app";
import { prisma } from "../src/lib/db";
import { resetDatabase, disconnect } from "./utils/db";

// quick helpers
async function login(email: string, password: string) {
  const res = await request(app).post("/auth/login").send({ email, password });
  expect(res.status).toBe(200);
  // support either {tokens: {access}} or {accessToken}
  return res.body?.tokens?.access || res.body?.accessToken;
}

function nextWeekdayDate(targetWday: number, hour: number, minute = 0) {
  const d = new Date();
  const diff = (targetWday - d.getDay() + 7) % 7 || 7; // always in the future
  d.setDate(d.getDate() + diff);
  d.setHours(hour, minute, 0, 0);
  return d;
}

describe("APPT CRUD happy path", () => {
  const ownerEmail = "crud.owner@test.com";
  const ownerPass = "OwnerPass123!";
  const vetEmail = "dr.crud@test.com";

  let ownerId = "";
  let petId = "";
  let vetId = "";
  let ownerToken = "";
  let adminToken = "";

  beforeAll(async () => {
    await resetDatabase();

    // admin (seeded)
    adminToken = await login("admin@vetcare.local", "admin123");

    // create owner via API
    await request(app)
      .post("/auth/register")
      .send({ email: ownerEmail, password: ownerPass, name: "CRUD Owner" })
      .expect([200, 201]);

    ownerToken = await login(ownerEmail, ownerPass);
    const u = await prisma.user.findUniqueOrThrow({ where: { email: ownerEmail } });
    ownerId = u.id;

    // create pet directly (schema-safe)
    const pet = await prisma.pet.create({
      data: {
        name: "Buddy",
        species: "DOG",
        ownerId,
      },
      select: { id: true },
    });
    petId = pet.id;

    // create vet + availability (admin controls vets)
    const vet = await prisma.vet.create({
      data: {
        name: "Dr CRUD",
        email: vetEmail,
        specialty: "General",
        active: true,
      },
      select: { id: true },
    });
    vetId = vet.id;

    // Next Wednesday 09:00-17:00 availability
    await prisma.vetAvailability.create({
      data: { vetId, weekday: 3, startMinutes: 9 * 60, endMinutes: 17 * 60 },
    });
  });

  afterAll(disconnect);

  it("book → list → detail → reschedule → cancel → restore", async () => {
    // choose slot inside availability (Wed 10:00-10:30 local)
    const start = nextWeekdayDate(3, 10, 0);
    const end = nextWeekdayDate(3, 10, 30);

    // BOOK
    const create = await request(app)
      .post("/appointments")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ petId, vetId, start: start.toISOString(), end: end.toISOString(), reason: "Checkup" });
    expect([201]).toContain(create.status);
    const apptId = create.body?.appointment?.id as string;
    expect(apptId).toBeTruthy();

    // LIST with date filter (should include owner field)
    const list = await request(app)
      .get("/appointments")
      .set("Authorization", `Bearer ${ownerToken}`)
      .query({ from: start.toISOString(), to: end.toISOString() });
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body.appointments)).toBe(true);
    expect(list.body.appointments[0].owner?.id).toBe(ownerId);

    // DETAIL
    const detail = await request(app)
      .get(`/appointments/${apptId}`)
      .set("Authorization", `Bearer ${ownerToken}`);
    expect(detail.status).toBe(200);
    expect(detail.body?.appointment?.id).toBe(apptId);

    // RESCHEDULE to 11:00-11:30 (same day, no conflict)
    const s2 = nextWeekdayDate(3, 11, 0);
    const e2 = nextWeekdayDate(3, 11, 30);
    const reschedule = await request(app)
      .patch(`/appointments/${apptId}/reschedule`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ start: s2.toISOString(), end: e2.toISOString() });
    expect(reschedule.status).toBe(200);

    // CANCEL
    const cancel = await request(app)
      .patch(`/appointments/${apptId}/cancel`)
      .set("Authorization", `Bearer ${ownerToken}`);
    expect(cancel.status).toBe(200);
    expect(cancel.body?.appointment?.status).toBe("CANCELLED");

    // RESTORE
    const restore = await request(app)
      .patch(`/appointments/${apptId}/restore`)
      .set("Authorization", `Bearer ${ownerToken}`);
    expect(restore.status).toBe(200);
    expect(restore.body?.appointment?.status).toBe("BOOKED");
  });
});
