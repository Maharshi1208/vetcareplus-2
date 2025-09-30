// src/pages/Appointments.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  listAppointments,
  type Appointment,
  updateAppointmentStatus, // <-- NEW helper with fallbacks
} from "../services/appointments";

type FlashState = { type: "success" | "error" | "info"; message: string };

type ApptStatus = "Booked" | "Completed" | "Cancelled";
type Appt = {
  id: string;
  date: string;  // YYYY-MM-DD (Toronto)
  start: string; // HH:mm (Toronto)
  end: string;   // HH:mm (Toronto)
  pet: string;
  owner: string;
  vet: string;
  reason: string;
  status: ApptStatus;
};

function statusBadge(s: ApptStatus) {
  const map: Record<ApptStatus, string> = {
    Booked: "border-sky-200 bg-sky-50 text-sky-700",
    Completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
    Cancelled: "border-rose-200 bg-rose-50 text-rose-700",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${map[s]}`}>
      {s}
    </span>
  );
}

const TZ = "America/Toronto";
function toTorontoDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: TZ });
}
function toTorontoTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
function mapStatus(s: Appointment["status"]): ApptStatus {
  switch (s) {
    case "BOOKED":
      return "Booked";
    case "COMPLETED":
      return "Completed";
    case "CANCELLED":
    case "NO_SHOW":
      return "Cancelled";
    default:
      return "Booked";
  }
}
function rowFrom(a: Appointment): Appt {
  return {
    id: a.id,
    date: toTorontoDate(a.start),
    start: toTorontoTime(a.start),
    end: toTorontoTime(a.end),
    pet: a.pet?.name ?? "—",
    // Prefer normalized owner object; then try joined pet.owner; finally fallback to ID
    owner:
      a.owner?.name ??
      (a.pet as any)?.owner?.name ??
      (a.owner?.id ?? a.pet?.ownerId ?? "—"),
    vet: a.vet?.name ?? "—",
    reason: a.reason ?? "—",
    status: mapStatus(a.status),
  };
}


export default function AppointmentsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [flash, setFlash] = useState<FlashState | null>(null);

  useEffect(() => {
    const s = (location.state as any)?.flash as FlashState | undefined;
    if (s) {
      setFlash(s);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const [q, setQ] = useState("");
  const [picked, setPicked] = useState("");

  const [rows, setRows] = useState<Appt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await listAppointments({ page: 1, pageSize: 50 });
        if (mounted) setRows((data.appointments || []).map(rowFrom));
      } catch (e) {
        console.error(e);
        if (mounted) setError("Failed to load appointments. Make sure you are logged in as admin.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows.filter((a) => {
      const matchesQuery =
        !s || [a.pet, a.owner, a.vet, a.reason, a.status].join(" ").toLowerCase().includes(s);
      const matchesDate = !picked || a.date === picked;
      return matchesQuery && matchesDate;
    });
  }, [rows, q, picked]);

  // Cancel / Restore
  async function onToggleCancel(row: Appt) {
    if (busyId) return;
    if (row.status === "Completed") {
      return;
    }

    const toStatus = row.status === "Cancelled" ? "BOOKED" : "CANCELLED";
    const confirmMsg =
      toStatus === "CANCELLED" ? "Cancel this appointment?" : "Restore this appointment to Booked?";
    if (!window.confirm(confirmMsg)) return;

    setBusyId(row.id);
    const prev = rows;
    setRows((r) =>
      r.map((x) => (x.id === row.id ? { ...x, status: toStatus === "CANCELLED" ? "Cancelled" : "Booked" } : x))
    );
    try {
      const updated = await updateAppointmentStatus(row.id, toStatus);
      setRows((r) => r.map((x) => (x.id === row.id ? rowFrom(updated) : x)));
    } catch (e: any) {
      console.error(e);
      setRows(prev);
      const msg =
        e?.error || e?.message || e?.response?.data?.error || "Failed to update status. Please try again.";
      window.alert(msg);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Appointments</h1>
          <p className="text-sm text-gray-500">Calendar of bookings (UI-only list).</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center rounded-full border px-3 py-1 text-sm text-gray-700">
            Total: <span className="ml-1 font-semibold">{filtered.length}</span>
          </span>
          {/* Gradient Calendar button */}
          <Link
            to="/appointments/calendar"
            className="rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 px-4 py-2 text-white shadow-sm hover:opacity-90"
          >
            Calendar
          </Link>
          {/* Gradient New Appointment button */}
          <Link
            to="/appointments/add"
            className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-2 text-white shadow-sm hover:opacity-90"
          >
            New Appointment
          </Link>
        </div>
      </div>

      {/* Flash */}
      {flash && (
        <div className="mb-4 flex items-start justify-between rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
            <span className="font-medium">{flash.message}</span>
          </div>
          <button onClick={() => setFlash(null)} className="rounded-md px-2 py-1 text-green-700 hover:bg-green-100">
            Dismiss
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {/* Card */}
      <div className="rounded-2xl border bg-white shadow-sm">
        {/* Filters */}
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by pet, owner, vet, reason, status..."
            className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400 sm:flex-1"
          />
          <input
            type="date"
            value={picked}
            onChange={(e) => setPicked(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400 sm:w-56"
            placeholder="yyyy-mm-dd"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 text-left text-sm text-gray-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Time</th>
                <th className="px-4 py-3 font-semibold">Pet</th>
                <th className="px-4 py-3 font-semibold">Owner</th>
                <th className="px-4 py-3 font-semibold">Vet</th>
                <th className="px-4 py-3 font-semibold">Reason</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {loading && (
                <tr>
                  <td className="px-4 py-10 text-center text-sm text-gray-600" colSpan={8}>
                    Loading appointments…
                  </td>
                </tr>
              )}

              {!loading &&
                filtered.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{a.date}</td>
                    <td className="px-4 py-3">
                      {a.start}–{a.end}
                    </td>
                    <td className="px-4 py-3">{a.pet}</td>
                    <td className="px-4 py-3">{a.owner}</td>
                    <td className="px-4 py-3">{a.vet}</td>
                    <td className="px-4 py-3">{a.reason}</td>
                    <td className="px-4 py-3">{statusBadge(a.status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/appointments/${a.id}`}
                          className="rounded-lg border px-3 py-1 text-sm hover:bg-gray-50"
                        >
                          View
                        </Link>
                        <Link
                          to={`/appointments/${a.id}/edit`}
                          className="rounded-lg bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => onToggleCancel(a)}
                          disabled={!!busyId || a.status === "Completed"}
                          title={a.status === "Completed" ? "Completed appointments can't be changed" : ""}
                          className="rounded-lg px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-60"
                        >
                          {a.status === "Cancelled" ? "Restore" : "Cancel"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td className="px-4 py-10 text-center text-sm text-gray-600" colSpan={8}>
                    No appointments match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
