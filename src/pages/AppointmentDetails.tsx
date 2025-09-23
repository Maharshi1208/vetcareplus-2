// src/pages/AppointmentDetails.tsx
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { listAppointments, type Appointment } from "../services/appointments";

type ApptStatus = "BOOKED" | "COMPLETED" | "CANCELLED";

type View = {
  id: string;
  pet: string;
  owner: string; // backend gives ownerId; show it as text for now
  vet: string;
  when: string;          // "YYYY-MM-DD HH:mm" in Toronto time
  durationMins: number;  // from start/end
  reason: string;
  status: ApptStatus;
  notes: string;
  fee: number;           // placeholder (no fee from backend yet)
};

function statusBadge(s: ApptStatus) {
  const map: Record<ApptStatus, string> = {
    BOOKED: "border-sky-200 bg-sky-50 text-sky-700",
    COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-700",
    CANCELLED: "border-rose-200 bg-rose-50 text-rose-700",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs ${map[s]}`}>
      {s}
    </span>
  );
}

const TZ = "America/Toronto";
function toTorontoDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: TZ });
}
function toTorontoTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
function mapStatus(s: Appointment["status"]): ApptStatus {
  if (s === "BOOKED") return "BOOKED";
  if (s === "COMPLETED") return "COMPLETED";
  return "CANCELLED"; // treat NO_SHOW/CANCELLED the same in this UI
}

export default function AppointmentDetailsPage() {
  const { id = "" } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [a, setA] = useState<View | null>(null);

  useEffect(() => {
    let mounted = true;

    async function findByIdViaList(appointmentId: string): Promise<Appointment | undefined> {
      // robust fallback: walk pages until we find it
      let page = 1;
      for (let i = 0; i < 20; i++) {
        const resp = await listAppointments({ page, pageSize: 100 });
        const hit = resp.appointments.find((x) => x.id === appointmentId);
        if (hit) return hit;
        if (!resp.hasNext) break;
        page++;
      }
      return undefined;
    }

    async function load() {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);

        const appt = await findByIdViaList(id);
        if (!appt) throw new Error("Not found");

        const start = new Date(appt.start);
        const end = new Date(appt.end);
        const durationMins = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
        const when = `${toTorontoDate(appt.start)} ${toTorontoTime(appt.start)}`;

        const view: View = {
          id: appt.id,
          pet: appt.pet?.name ?? "—",
          owner: appt.pet?.ownerId ? String(appt.pet.ownerId) : "—",
          vet: appt.vet?.name ?? "—",
          when,
          durationMins,
          reason: appt.reason ?? "—",
          status: mapStatus(appt.status),
          notes: appt.notes ?? "—",
          fee: 0,
        };

        if (mounted) setA(view);
      } catch (e) {
        console.error(e);
        if (mounted) setError("Failed to load appointment.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  return (
    <div className="p-6 space-y-6">
      {/* Header (unchanged) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">Appointment Details</h1>
          <p className="text-sm text-gray-500">
            ID: <span className="font-mono">{id}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {a && a.status === "BOOKED" && (
            <Link
              to={`/pay/checkout/${a.id}`}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm text-white shadow-sm hover:bg-blue-700"
              title="Proceed to mock payment"
            >
              Pay ${a.fee.toFixed(2)}
            </Link>
          )}
          <Link to="/appointments" className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50">
            ← Back to list
          </Link>
        </div>
      </div>

      {/* Error / Loading */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {loading && <div className="text-sm text-gray-600">Loading…</div>}

      {/* Card (unchanged) */}
      {!loading && a && (
        <div className="rounded-2xl border bg-white shadow-sm">
          <div className="border-b p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-medium">Overview</h2>
              {statusBadge(a.status)}
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <dt className="text-xs uppercase text-gray-500">Pet</dt>
                <dd className="text-sm">{a.pet}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-gray-500">Owner</dt>
                <dd className="text-sm">{a.owner}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-gray-500">Veterinarian</dt>
                <dd className="text-sm">{a.vet}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-gray-500">When</dt>
                <dd className="text-sm">{a.when}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-gray-500">Duration</dt>
                <dd className="text-sm">{a.durationMins} mins</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-gray-500">Reason</dt>
                <dd className="text-sm">{a.reason}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-gray-500">Fee</dt>
                <dd className="text-sm">${a.fee.toFixed(2)}</dd>
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <dt className="text-xs uppercase text-gray-500">Notes</dt>
                <dd className="text-sm">{a.notes || "—"}</dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}
