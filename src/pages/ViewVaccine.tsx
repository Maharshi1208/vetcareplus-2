import React from "react";
import { useParams, Link } from "react-router-dom";

export default function ViewVaccine() {
  const { id } = useParams(); // vaccine id placeholder

  return (
    <div className="space-y-4">
      {/* Breadcrumbs */}
      <div className="text-sm text-gray-500 flex items-center gap-2">
        <Link to="/health" className="hover:underline">Health</Link>
        <span>/</span>
        <span className="text-gray-700">View Vaccine</span>
        {id ? <span className="ml-1 text-gray-400">({id})</span> : null}
      </div>

      {/* Title */}
      <h1 className="text-2xl font-semibold">View Vaccine</h1>

      {/* Card */}
      <div className="rounded-2xl border p-4 md:p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Vaccine Name</label>
            <p className="px-3 py-2 rounded-xl border bg-gray-50">Rabies (UI only)</p>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Given On</label>
            <p className="px-3 py-2 rounded-xl border bg-gray-50">2025-08-01</p>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Next Due</label>
            <p className="px-3 py-2 rounded-xl border bg-gray-50">2026-08-01</p>
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Notes</label>
          <p className="px-3 py-2 rounded-xl border bg-gray-50">
            Placeholder notes for this vaccine (UI only).
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <Link
          to={`/vaccines/${id}/edit`}
          className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
        >
          Edit
        </Link>
        <Link
          to="/health"
          className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50"
        >
          Back
        </Link>
      </div>
    </div>
  );
}
