import React from "react";
import { Link, useLocation } from "react-router-dom";

type Receipt = {
  id: string;
  apptId: string;
  amount: number;
  status: "SUCCESS" | "FAILED";
  method: "CARD" | "UPI" | "CASH" | string;
  note?: string;
  when: string; // ISO
};

export default function PayResultPage() {
  const location = useLocation();
  const receipt = (location.state as any)?.receipt as Receipt | undefined;

  // Fallback if user opened this directly
  if (!receipt) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold">Payment Result</h1>
          <p className="mt-2 text-gray-600">
            No receipt data found (this page is normally reached from Checkout).
          </p>
          <div className="mt-4 flex gap-3">
            <Link to="/appointments" className="rounded-xl border px-4 py-2 hover:bg-gray-50">
              ← Back to Appointments
            </Link>
            <Link to="/dashboard" className="rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const ok = receipt.status === "SUCCESS";

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Payment {ok ? "Successful" : "Failed"}</h1>
          <p className="text-sm text-gray-500">UI-only mock receipt.</p>
        </div>
        <Link to="/appointments" className="text-sm underline">← Back to Appointments</Link>
      </div>

      {/* Result card */}
      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="border-b p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-medium">Receipt</h2>
            <span
              className={
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs " +
                (ok
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-rose-200 bg-rose-50 text-rose-700")
              }
            >
              {receipt.status}
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase text-gray-500">Receipt ID</dt>
              <dd className="text-sm font-mono">{receipt.id}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-gray-500">Appointment</dt>
              <dd className="text-sm">
                <Link to={`/appointments/${receipt.apptId}`} className="text-sky-700 hover:underline">
                  {receipt.apptId}
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-gray-500">Amount</dt>
              <dd className="text-sm">${receipt.amount.toFixed(2)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-gray-500">Method</dt>
              <dd className="text-sm">{receipt.method}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs uppercase text-gray-500">Timestamp</dt>
              <dd className="text-sm">{new Date(receipt.when).toLocaleString()}</dd>
            </div>
            {receipt.note ? (
              <div className="sm:col-span-2">
                <dt className="text-xs uppercase text-gray-500">Note</dt>
                <dd className="text-sm">{receipt.note}</dd>
              </div>
            ) : null}
          </dl>
        </div>

        <div className="flex flex-col gap-3 border-t p-4 sm:flex-row sm:justify-end">
          <Link
            to={`/appointments/${receipt.apptId}`}
            className="rounded-xl border px-4 py-2 hover:bg-gray-50"
          >
            View Appointment
          </Link>
          <Link
            to="/appointments"
            className="rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Back to Appointments
          </Link>
        </div>
      </div>
    </div>
  );
}
