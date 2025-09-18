import React, { useMemo, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

type ApptStatus = "Booked" | "Rescheduled" | "Cancelled" | "Completed";
type FlashState = { type: "success" | "error" | "info"; message: string };

type Appointment = {
  id: string;
  date: string;      // ISO date string (YYYY-MM-DD)
  start: string;     // HH:mm
  end: string;       // HH:mm
  petName: string;
  ownerName: string;
  vetName: string;
  reason?: string;
  status: ApptStatus;
};

const MOCK_APPTS: Appointment[] = [
  { id: "a1", date: "2025-09-17", start: "09:00", end: "09:30", petName: "Buddy", ownerName: "Alice Johnson", vetName: "Dr. Anna Smith", reason: "Checkup", status: "Booked" },
  { id: "a2", date: "2025-09-17", start: "10:00", end: "10:45", petName: "Misty", ownerName: "Alice Johnson", vetName: "Dr. Brian Lee", reason: "Skin rash", status: "Completed" },
  { id: "a3", date: "2025-09-18", start: "11:30", end: "12:00", petName: "Kiwi",  ownerName: "Bob Patel",     vetName: "Dr. Carla Gomez", reason: "Beak trim", status: "Cancelled" },
];

function statusBadge(s: ApptStatus) {
  const map: Record<ApptStatus, string> = {
    Booked: "border-sky-200 bg-sky-50 text-sky-700",
    Rescheduled: "border-amber-200 bg-amber-50 text-amber-700",
    Cancelled: "border-rose-200 bg-rose-50 text-rose-700",
    Completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${map[s]}`}>
      {s}
    </span>
  );
}

export default function AppointmentsPage() {
  const [q, setQ] = useState("");
  const [day, setDay] = useState<string>("");

  // --- Flash banner (one-time) ---
  const location = useLocation();
  const navigate = useNavigate();
  const [flash, setFlash] = useState<FlashState | null>(null);

  useEffect(() => {
    const s = (location.state as any)?.flash as FlashState | undefined;
    if (s) {
      setFlash(s);
      // clear history state so it doesn't reappear on refresh/back
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return MOCK_APPTS.filter((a) => {
      const matchesDay = day ? a.date === day : true;
      const matchesText = term
        ? [
            a.petName,
            a.ownerName,
            a.vetName,
            a.reason ?? "",
            a.status,
            a.date,
            a.start,
            a.end,
          ]
            .join(" ")
            .toLowerCase()
            .includes(term)
        : true;
      return matchesDay && matchesText;
    });
  }, [q, day]);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Appointments</h1>
          <p className="text-sm text-gray-500">Calendar of bookings (UI-only list).</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center rounded-full border px-3 py-1 text-sm text-gray-700">
            Total: <span className="ml-1 font-semibold">{filtered.length}</span>
          </span>
          <Link
            to="/appointments/add"
            className="inline-flex items-center rounded-xl bg-blue-600 px-4 py-2 text-white shadow-sm hover:bg-blue-700"
          >
            <span className="mr-2 text-lg leading-none">＋</span>
            New Appointment
          </Link>
        </div>
      </div>

      {/* Flash banner */}
      {flash && (
        <div className="mb-4 flex items-start justify-between rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
            <span className="font-medium">{flash.message}</span>
          </div>
          <button
            onClick={() => setFlash(null)}
            className="rounded-md px-2 py-1 text-green-700 hover:bg-green-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filters + Table */}
      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="grid gap-4 border-b p-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by pet, owner, vet, reason, status…"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
            />
          </div>
          <div>
            <input
              type="date"
              value={day}
              onChange={(e) => setDay(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
            />
          </div>
        </div>

        <div className="p-2 sm:p-4">
          <div className="overflow-auto rounded-2xl border bg-white shadow-sm">
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
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {filtered.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{a.date}</td>
                    <td className="px-4 py-3">
                      {a.start}–{a.end}
                    </td>
                    <td className="px-4 py-3">{a.petName}</td>
                    <td className="px-4 py-3">{a.ownerName}</td>
                    <td className="px-4 py-3">{a.vetName}</td>
                    <td className="px-4 py-3">{a.reason ?? "—"}</td>
                    <td className="px-4 py-3">{statusBadge(a.status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link to={`/appointments/${a.id}`} className="rounded-lg border px-3 py-1 text-sm hover:bg-gray-50">
                          View
                        </Link>
                        <Link
                          to={`/appointments/${a.id}/edit`}
                          className="rounded-lg bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => alert("UI-only: cancel/reschedule not wired")}
                          className="rounded-lg px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-center text-sm text-gray-600">
                      No appointments match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
