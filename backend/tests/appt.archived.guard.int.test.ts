import request from "supertest";
import app from "../src/app";
import { prisma } from "../src/lib/db";
import { resetDatabase, disconnect } from "./utils/db";

function nextWeekdayDate(targetWday: number, hour: number, minute = 0) {
  const d = new Date();
  const diff = (targetWday - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + diff);
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function login(email: string, password: string) {
  const res = await request(app).post("/auth/login").send({ email, password });
  expect(res.status).toBe(200);
  return res.body?.tokens?.access || res.body?.accessToken;
}

describe("APPT booking guard: archived pet", () => {
  let ownerId = "", ownerToken = "", vetId = "";

  beforeAll(async () => {
    await resetDatabase();

    await request(app)
      .post("/auth/register")
      .send({ email: "arch.owner@test.com", password: "OwnerPass123!", name: "Arch Owner" })
      .expect([200, 201]);

    ownerToken = await login("arch.owner@test.com", "OwnerPass123!");
    const u = await prisma.user.findUniqueOrThrow({ where: { email: "arch.owner@test.com" } });
    ownerId = u.id;

    const vet = await prisma.vet.create({
      data: { name: "Dr Arc", email: "dr.arch@test.com", specialty: "Gen", active: true },
      select: { id: true },
    });
    vetId = vet.id;
    await prisma.vetAvailability.create({
      data: { vetId, weekday: 4, startMinutes: 9 * 60, endMinutes: 17 * 60 },
    });
  });

  afterAll(disconnect);

  it("rejects booking for archived pet", async () => {
    const pet = await prisma.pet.create({
      data: { name: "Oldie", species: "CAT", ownerId, archived: true },
      select: { id: true },
    });

    const s = nextWeekdayDate(4, 10, 0);
    const e = nextWeekdayDate(4, 10, 30);

    const res = await request(app)
      .post("/appointments")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ petId: pet.id, vetId, start: s.toISOString(), end: e.toISOString() });

    expect(res.status).toBe(400);
    expect(String(res.body?.error || "")).toMatch(/archived/i);
  });
});
