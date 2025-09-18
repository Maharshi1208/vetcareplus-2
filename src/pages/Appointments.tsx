// src/pages/Appointments.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

type FlashState = { type: "success" | "error" | "info"; message: string };

type ApptStatus = "Booked" | "Completed" | "Cancelled";
type Appt = {
  id: string;
  date: string; // YYYY-MM-DD
  start: string; // HH:mm
  end: string;   // HH:mm
  pet: string;
  owner: string;
  vet: string;
  reason: string;
  status: ApptStatus;
};

const MOCK_APPTS: Appt[] = [
  {
    id: "a1",
    date: "2025-09-17",
    start: "09:00",
    end: "09:30",
    pet: "Buddy",
    owner: "Alice Johnson",
    vet: "Dr. Anna Smith",
    reason: "Checkup",
    status: "Booked",
  },
  {
    id: "a2",
    date: "2025-09-17",
    start: "10:00",
    end: "10:45",
    pet: "Misty",
    owner: "Alice Johnson",
    vet: "Dr. Brian Lee",
    reason: "Skin rash",
    status: "Completed",
  },
  {
    id: "a3",
    date: "2025-09-18",
    start: "11:30",
    end: "12:00",
    pet: "Kiwi",
    owner: "Bob Patel",
    vet: "Dr. Carla Gomez",
    reason: "Beak trim",
    status: "Cancelled",
  },
];

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

export default function AppointmentsPage() {
  // flash banner (one-time)
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

  // search + date filter (UI-only)
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return MOCK_APPTS.filter((a) => {
      const matchesQuery =
        !s ||
        [a.pet, a.owner, a.vet, a.reason, a.status]
          .join(" ")
          .toLowerCase()
          .includes(s);
      const matchesDate = !picked || a.date === picked;
      return matchesQuery && matchesDate;
    });
  }, [q, picked]);

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
          {/* NEW: Calendar button (added) */}
          <Link
            to="/appointments/calendar"
            className="rounded-xl border px-4 py-2 hover:bg-gray-50"
          >
            Calendar
          </Link>
          <Link
            to="/appointments/add"
            className="rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
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
              {filtered.map((a) => (
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
                        onClick={() => window.alert("UI-only: cancel flow")}
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
