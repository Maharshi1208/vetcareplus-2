// frontend/src/services/appointments.ts
import { apiGet, apiPost, apiPatch, apiDelete } from "./api";

/** ---- Types ---- */
export type AppointmentStatus = "BOOKED" | "CANCELLED" | "COMPLETED" | "NO_SHOW";

export type Appointment = {
  id: string;
  petId: string;
  vetId: string;
  start: string; // ISO datetime
  end: string;   // ISO datetime
  status: AppointmentStatus;
  reason: string | null;
  notes: string | null;
  // Optional expansions (observed in your backend responses)
  pet?: { name: string; ownerId: string };
  vet?: { name: string; specialty: string | null };
  createdAt?: string;
  updatedAt?: string;
};

export type AppointmentListResponse = {
  ok: boolean;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
  appointments: Appointment[];
};

export type AppointmentResponse = { ok: boolean; appointment: Appointment };

/** ---- List / Read ---- */

// Server returns a paginated envelope; keep it so we can show totals later.
export async function listAppointments(params?: {
  page?: number;
  pageSize?: number;
  vetId?: string;   // your backend may ignore filters; we’ll still pass if present
  petId?: string;
  date?: string;    // YYYY-MM-DD
  status?: AppointmentStatus;
}): Promise<AppointmentListResponse> {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  if (params?.pageSize) qs.set("pageSize", String(params.pageSize));
  if (params?.vetId) qs.set("vetId", params.vetId);
  if (params?.petId) qs.set("petId", params.petId);
  if (params?.date) qs.set("date", params.date);
  if (params?.status) qs.set("status", params.status);
  const q = qs.toString();
  const url = q ? `/appointments?${q}` : "/appointments";
  return apiGet<AppointmentListResponse>(url);
}

export async function getAppointment(id: string): Promise<Appointment> {
  const data = await apiGet<AppointmentResponse>(`/appointments/${id}`);
  return data.appointment;
}

/** ---- Create / Update / Delete ---- */

// IMPORTANT: start/end must be ISO datetimes with correct timezone, e.g. "2025-09-29T09:00:00-04:00"
export async function createAppointment(payload: {
  vetId: string;
  petId: string;
  start: string; // ISO with offset (e.g., -04:00)
  end: string;   // ISO with offset
  reason?: string | null;
  notes?: string | null;
}): Promise<Appointment> {
  const data = await apiPost<AppointmentResponse>("/appointments", payload);
  return data.appointment;
}

export async function updateAppointment(
  id: string,
  input: Partial<Pick<Appointment, "start" | "end" | "status" | "reason" | "notes">>
): Promise<Appointment> {
  const data = await apiPatch<AppointmentResponse>(`/appointments/${id}`, input);
  return data.appointment;
}

export async function deleteAppointment(id: string): Promise<{ ok: true }> {
  return apiDelete(`/appointments/${id}`);
}

/** ---- Helpers for building ISO strings in Toronto time (optional, handy for forms) ---- */

// Given date "YYYY-MM-DD" and time "HH:MM", return ISO with -04:00/-05:00 depending on DST.
export function torontoISO(dateYYYYMMDD: string, timeHHMM: string): string {
  // This constructs a local Date in America/Toronto, then formats with the correct offset.
  // We keep it simple here; if you use a date lib (e.g., luxon/dayjs), you can swap this out.
  const [y, m, d] = dateYYYYMMDD.split("-").map(Number);
  const [hh, mm] = timeHHMM.split(":").map(Number);
  // Build in local system time, then correct to Toronto using Intl API.
  const dt = new Date(Date.UTC(y, (m - 1), d, hh, mm, 0)); // start from UTC
  // Format with offset for America/Toronto
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  }).formatToParts(dt);

  const parts: Record<string, string> = {};
  for (const p of fmt) parts[p.type] = p.value;

  // Recompose local wall time
  const local = new Date(`${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`);
  // Compute offset between local time and UTC, in minutes
  const offsetMin = -local.getTimezoneOffset(); // e.g. -240 => -04:00
  const sign = offsetMin >= 0 ? "+" : "-";
  const offAbs = Math.abs(offsetMin);
  const offHH = String(Math.trunc(offAbs / 60)).padStart(2, "0");
  const offMM = String(offAbs % 60).padStart(2, "0");
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}${sign}${offHH}:${offMM}`;
}
