import React from "react";
import { Link } from "react-router-dom";

export default function AddMedication() {
  return (
    <div className="space-y-4">
      {/* Breadcrumbs */}
      <div className="text-sm text-gray-500 flex items-center gap-2">
        <Link to="/pets" className="hover:underline">Pets</Link>
        <span>/</span>
        <span className="text-gray-700">Add Medication</span>
      </div>

      {/* Title */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Add Medication</h1>
        <Link
          to="/pets"
          className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50"
        >
          Back
        </Link>
      </div>

      {/* Card */}
      <div className="rounded-2xl border p-4 md:p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Medication Name</label>
            <input className="w-full rounded-xl border px-3 py-2" placeholder="Enter medication name" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Dosage</label>
            <input className="w-full rounded-xl border px-3 py-2" placeholder="e.g. 5mg" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Frequency</label>
            <input className="w-full rounded-xl border px-3 py-2" placeholder="e.g. Twice a day" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Duration</label>
            <input className="w-full rounded-xl border px-3 py-2" placeholder="e.g. 7 days" />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Notes</label>
          <textarea className="w-full rounded-xl border px-3 py-2" rows={3} placeholder="Additional notes..." />
        </div>

        <button
          type="button"
          disabled
          className="w-full px-4 py-2 rounded-xl bg-gray-200 text-gray-600 cursor-not-allowed"
        >
          Save (UI only)
        </button>
      </div>
    </div>
  );
}
