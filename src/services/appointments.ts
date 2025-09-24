// src/services/appointments.ts
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

/** ---- Utils ---- */
function errMsg(e: any): string {
  const data = e?.response?.data;
  if (typeof data === "string") return data;
  if (data?.error) return String(data.error);
  return e?.message || e?.response?.statusText || "Request failed";
}

function plusOneDay(yyyyMmDd: string): string {
  const [y, m, d] = yyyyMmDd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, (m - 1), d, 0, 0, 0));
  dt.setUTCDate(dt.getUTCDate() + 1);
  const y2 = dt.getUTCFullYear();
  const m2 = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const d2 = String(dt.getUTCDate()).padStart(2, "0");
  return `${y2}-${m2}-${d2}`;
}

/** ---- List / Read ---- */

export async function listAppointments(params?: {
  page?: number;
  pageSize?: number;
  vetId?: string;
  petId?: string;
  /** UI date filter; mapped to backend (from..to) */
  date?: string; // YYYY-MM-DD
  status?: AppointmentStatus;
}): Promise<AppointmentListResponse> {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  if (params?.pageSize) qs.set("pageSize", String(params.pageSize));
  if (params?.vetId) qs.set("vetId", params.vetId);
  if (params?.petId) qs.set("petId", params.petId);
  if (params?.status) qs.set("status", params.status);
  // backend expects from/to; map a single day to [date, date+1)
  if (params?.date) {
    qs.set("from", params.date);
    qs.set("to", plusOneDay(params.date));
  }
  const q = qs.toString();
  const url = q ? `/appointments?${q}` : "/appointments";
  return apiGet<AppointmentListResponse>(url);
}

export async function getAppointment(id: string): Promise<Appointment> {
  const data = await apiGet<AppointmentResponse>(`/appointments/${id}`);
  return data.appointment;
}

/** ---- Create / Update / Delete ---- */

// NOTE: start/end must be ISO with correct timezone (e.g., "2025-09-29T09:00:00-04:00")
export async function createAppointment(payload: {
  vetId: string;
  petId: string;
  start: string; // ISO with offset
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

/** ---- Reschedule ---- */

export async function rescheduleAppointment(
  id: string,
  input: { date: string; start: string; end: string }
): Promise<Appointment> {
  const payload = {
    start: torontoISO(input.date, input.start),
    end: torontoISO(input.date, input.end),
  };
  const data = await apiPatch<AppointmentResponse>(`/appointments/${id}/reschedule`, payload);
  return data.appointment;
}

/** ---- Robust status updater (with fallbacks that match your backend) ----
 * Order:
 *  1) POST /appointments/:id/status   { status }   ← you added this
 *  2) PATCH /appointments/:id         { status }   ← some servers support this
 *  3) PATCH /appointments/:id/cancel               ← explicit for CANCELLED
 *     PATCH /appointments/:id/restore              ← explicit for BOOKED
 */
export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus
): Promise<Appointment> {
  // 1) preferred: generic status endpoint
  try {
    const d = await apiPost<AppointmentResponse>(`/appointments/${id}/status`, { status });
    return d.appointment;
  } catch (e1: any) {
    // 2) generic PATCH
    try {
      const d = await apiPatch<AppointmentResponse>(`/appointments/${id}`, { status });
      return d.appointment;
    } catch (e2: any) {
      // 3) explicit verbs for cancel/restore
      try {
        if (status === "CANCELLED") {
          const d = await apiPatch<AppointmentResponse>(`/appointments/${id}/cancel`, {});
          return d.appointment;
        }
        if (status === "BOOKED") {
          const d = await apiPatch<AppointmentResponse>(`/appointments/${id}/restore`, {});
          return d.appointment;
        }
      } catch (e3: any) {
        throw new Error(
          `POST /status failed: ${errMsg(e1)} | PATCH /:id failed: ${errMsg(e2)} | explicit failed: ${errMsg(e3)}`
        );
      }
      // if other statuses reach here, surface earlier error
      throw new Error(`POST /status failed: ${errMsg(e1)} | PATCH /:id failed: ${errMsg(e2)}`);
    }
  }
}

/** ---- Helpers for building ISO strings in Toronto time ---- */

// Given date "YYYY-MM-DD" and time "HH:MM", return ISO with -04:00/-05:00 depending on DST.
export function torontoISO(dateYYYYMMDD: string, timeHHMM: string): string {
  const [y, m, d] = dateYYYYMMDD.split("-").map(Number);
  const [hh, mm] = timeHHMM.split(":").map(Number);
  // Build a UTC base, then format into America/Toronto wall time
  const dt = new Date(Date.UTC(y, m - 1, d, hh, mm, 0));

  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(dt);

  const parts: Record<string, string> = {};
  for (const p of fmt) parts[p.type] = p.value;

  const local = new Date(
    `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`
  );
  const offsetMin = -local.getTimezoneOffset();
  const sign = offsetMin >= 0 ? "+" : "-";
  const offAbs = Math.abs(offsetMin);
  const offHH = String(Math.trunc(offAbs / 60)).padStart(2, "0");
  const offMM = String(offAbs % 60).padStart(2, "0");
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}${sign}${offHH}:${offMM}`;
}

/** ---- Convenience wrappers (UI can keep using these) ---- */
export async function cancelAppointment(id: string) {
  return updateAppointmentStatus(id, "CANCELLED");
}

export async function restoreAppointment(id: string) {
  return updateAppointmentStatus(id, "BOOKED");
}
