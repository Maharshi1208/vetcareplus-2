// src/pages/AppointmentDetails.tsx
import React from "react";
import { Link, useParams } from "react-router-dom";

type ApptStatus = "BOOKED" | "COMPLETED" | "CANCELLED";

const MOCK_APPT = {
  id: "apt-001",
  pet: "Buddy",
  owner: "Alice",
  vet: "Dr. Smith",
  when: "2025-09-20 10:00",
  durationMins: 30,
  reason: "General checkup",
  status: "BOOKED" as ApptStatus,
  notes: "Bring previous vaccination card.",
  fee: 75.0,
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

export default function AppointmentDetailsPage() {
  const { id } = useParams();
  const a = { ...MOCK_APPT, id: id ?? MOCK_APPT.id };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">Appointment Details</h1>
          <p className="text-sm text-gray-500">
            ID: <span className="font-mono">{a.id}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* NEW: Pay button (mock checkout) */}
          {a.status === "BOOKED" && (
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

      {/* Card */}
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
    </div>
  );
}
