import React from "react";
import { Link, useParams } from "react-router-dom";

type ApptStatus = "Booked" | "Rescheduled" | "Cancelled" | "Completed";

type Appointment = {
  id: string;
  date: string;      // YYYY-MM-DD
  start: string;     // HH:mm
  end: string;       // HH:mm
  petName: string;
  ownerName: string;
  vetName: string;
  reason?: string;
  status: ApptStatus;
  notes?: string;
};

// Keep IDs consistent with the list page for demo
const MOCK: Record<string, Appointment> = {
  a1: {
    id: "a1",
    date: "2025-09-17",
    start: "09:00",
    end: "09:30",
    petName: "Buddy",
    ownerName: "Alice Johnson",
    vetName: "Dr. Anna Smith",
    reason: "Checkup",
    status: "Booked",
    notes: "Bring previous vaccination card.",
  },
  a2: {
    id: "a2",
    date: "2025-09-17",
    start: "10:00",
    end: "10:45",
    petName: "Misty",
    ownerName: "Alice Johnson",
    vetName: "Dr. Brian Lee",
    reason: "Skin rash",
    status: "Completed",
    notes: "Ointment prescribed.",
  },
  a3: {
    id: "a3",
    date: "2025-09-18",
    start: "11:30",
    end: "12:00",
    petName: "Kiwi",
    ownerName: "Bob Patel",
    vetName: "Dr. Carla Gomez",
    reason: "Beak trim",
    status: "Cancelled",
    notes: "Canceled by owner",
  },
};

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

export default function AppointmentDetailsPage() {
  const { id } = useParams();
  const a: Appointment =
    (id && MOCK[id]) ||
    ({
      id: id ?? "unknown",
      date: "—",
      start: "—",
      end: "—",
      petName: "—",
      ownerName: "—",
      vetName: "—",
      status: "Booked",
    } as Appointment);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Appointment Details</h1>
          <p className="text-sm text-gray-500">Read-only UI (no API yet).</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/appointments/${a.id}/edit`}
            className="rounded-xl bg-blue-600 px-4 py-2 text-white shadow-sm hover:bg-blue-700"
          >
            Edit
          </Link>
          <Link to="/appointments" className="rounded-xl border px-4 py-2 hover:bg-gray-50">
            Back to Appointments
          </Link>
        </div>
      </div>

      {/* Core details */}
      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="border-b p-4">
          <h2 className="text-base font-medium">Summary</h2>
        </div>
        <div className="p-4 sm:p-6 grid gap-4 sm:grid-cols-2">
          <div>
            <div className="text-xs text-gray-500">Date</div>
            <div className="mt-1 rounded-lg border bg-gray-50 px-3 py-2">{a.date}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Time</div>
            <div className="mt-1 rounded-lg border bg-gray-50 px-3 py-2">
              {a.start}–{a.end}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Pet</div>
            <div className="mt-1 rounded-lg border bg-gray-50 px-3 py-2">{a.petName}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Owner</div>
            <div className="mt-1 rounded-lg border bg-gray-50 px-3 py-2">{a.ownerName}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Veterinarian</div>
            <div className="mt-1 rounded-lg border bg-gray-50 px-3 py-2">{a.vetName}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Status</div>
            <div className="mt-1">{statusBadge(a.status)}</div>
          </div>
          <div className="sm:col-span-2">
            <div className="text-xs text-gray-500">Reason</div>
            <div className="mt-1 rounded-lg border bg-gray-50 px-3 py-2">{a.reason ?? "—"}</div>
          </div>
          <div className="sm:col-span-2">
            <div className="text-xs text-gray-500">Notes</div>
            <div className="mt-1 rounded-lg border bg-gray-50 px-3 py-2">{a.notes ?? "—"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
