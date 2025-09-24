import React from "react";
import { useParams, Link } from "react-router-dom";

export default function EditVaccine() {
  const { id } = useParams();

  return (
    <div className="space-y-4">
      {/* Breadcrumbs */}
      <div className="text-sm text-gray-500 flex items-center gap-2">
        <Link to="/health" className="hover:underline">Health</Link>
        <span>/</span>
        <span className="text-gray-700">Edit Vaccine</span>
        {id ? <span className="ml-1 text-gray-400">({id})</span> : null}
      </div>

      {/* Title */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Edit Vaccine</h1>
        <div className="flex gap-2">
          <button
            type="button"
            disabled
            className="px-4 py-2 rounded-xl bg-gray-200 text-gray-600 cursor-not-allowed"
          >
            Save (UI only)
          </button>
          <Link
            to="/health"
            className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>
      </div>

      {/* Card */}
      <div className="rounded-2xl border p-4 md:p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Vaccine Name</label>
            <input className="w-full rounded-xl border px-3 py-2" defaultValue="Rabies (UI only)" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Given On</label>
            <input type="date" className="w-full rounded-xl border px-3 py-2" defaultValue="2025-08-01" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Next Due</label>
            <input type="date" className="w-full rounded-xl border px-3 py-2" defaultValue="2026-08-01" />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Notes</label>
          <textarea
            className="w-full rounded-xl border px-3 py-2"
            rows={3}
            defaultValue="This is a placeholder edit form for vaccines."
          />
        </div>
      </div>

      <p className="text-xs text-gray-400">This page is UI-only. No backend integration yet.</p>
    </div>
  );
}
