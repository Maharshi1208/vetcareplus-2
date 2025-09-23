import React from "react";
import { useParams, Link } from "react-router-dom";

export default function AppointmentEdit() {
  const { id } = useParams(); // UI-only; no fetch

  return (
    <div className="space-y-4">
      {/* Breadcrumbs */}
      <div className="text-sm text-gray-500 flex items-center gap-2">
        <Link to="/appointments" className="hover:underline">Appointments</Link>
        <span>/</span>
        <span className="text-gray-700">Edit</span>
        {id ? <span className="ml-1 text-gray-400">({id})</span> : null}
      </div>

      {/* Title */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Edit Appointment</h1>
        {/* UI-only action buttons */}
        <div className="flex gap-2">
          <button
            type="button"
            disabled
            className="px-4 py-2 rounded-xl bg-gray-200 text-gray-600 cursor-not-allowed"
            title="UI-only (disabled)"
          >
            Save
          </button>
          <Link
            to="/appointments"
            className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>
      </div>

      {/* Card */}
      <div className="rounded-2xl border p-4 md:p-6 space-y-6">
        {/* Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Pet</label>
            <input
              disabled
              value="(UI only) Select Pet"
              className="w-full rounded-xl border px-3 py-2 bg-gray-50 text-gray-600"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Vet</label>
            <input
              disabled
              value="(UI only) Select Vet"
              className="w-full rounded-xl border px-3 py-2 bg-gray-50 text-gray-600"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Status</label>
            <input
              disabled
              value="Booked"
              className="w-full rounded-xl border px-3 py-2 bg-gray-50 text-gray-600"
              readOnly
            />
          </div>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Start</label>
            <input
              disabled
              value="2025-09-28 10:30"
              className="w-full rounded-xl border px-3 py-2 bg-gray-50 text-gray-600"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">End</label>
            <input
              disabled
              value="2025-09-28 11:00"
              className="w-full rounded-xl border px-3 py-2 bg-gray-50 text-gray-600"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Reason</label>
            <input
              disabled
              value="Checkup (UI only)"
              className="w-full rounded-xl border px-3 py-2 bg-gray-50 text-gray-600"
              readOnly
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm text-gray-600 mb-1">Notes</label>
          <textarea
            disabled
            rows={4}
            className="w-full rounded-xl border px-3 py-2 bg-gray-50 text-gray-600"
            defaultValue="This is a placeholder UI. No API connected yet."
          />
        </div>
      </div>

      {/* Help text */}
      <p className="text-xs text-gray-400">
        This page is UI-only to avoid 404. Fields are disabled until backend is wired.
      </p>
    </div>
  );
}
