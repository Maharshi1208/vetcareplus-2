import React, { useState } from "react";
import { Link, useParams, useLocation, useNavigate } from "react-router-dom";

// Fallback mock entries (same as HealthPage)
const MOCK_ENTRIES = [
  {
    id: "h3",
    title: "DHPP booster",
    date: "2025-09-10",
    note: "Next due: 2026-09-10",
  },
  {
    id: "h2",
    title: "Rabies",
    date: "2025-08-01",
    note: "Next due: 2026-08-01",
  },
];

export default function EditVaccine() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Try to get entry from state or fallback to mock
  const entryFromState = (location.state as any)?.entry;
  const entry =
    entryFromState || MOCK_ENTRIES.find((e) => e.id === id) || null;

  if (!entry) {
    return (
      <div className="p-6 space-y-4">
        <div className="text-sm text-gray-500 flex items-center gap-2">
          <Link to="/health" className="hover:underline">Health</Link>
          <span>/</span>
          <span className="text-gray-700">Edit Vaccine</span>
        </div>
        <h1 className="text-2xl font-semibold">Not Found</h1>
        <p className="text-gray-600">No vaccine found with ID {id} (UI-only).</p>
        <Link
          to="/health"
          className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50"
        >
          Back
        </Link>
      </div>
    );
  }

  // Form state (pre-filled)
  const [name, setName] = useState(entry.title || "");
  const [givenOn, setGivenOn] = useState(entry.date || "");
  const [nextDue, setNextDue] = useState(
    entry.note?.includes("Next due:") ? entry.note.replace("Next due: ", "") : ""
  );
  const [notes, setNotes] = useState(
    entry.note?.includes("Next due:") ? "" : entry.note || ""
  );

  const handleSave = () => {
    const updatedEntry = {
      ...entry,
      title: name,
      date: givenOn,
      note: `Next due: ${nextDue}. ${notes}`,
    };

    navigate("/health", {
      state: {
        flash: { type: "success", message: `Vaccine "${name}" updated.` },
        newEntry: updatedEntry,
      },
    });
  };

  const isDisabled = !name || !givenOn;

  return (
    <div className="space-y-4 p-6">
      <div className="text-sm text-gray-500 flex items-center gap-2">
        <Link to="/health" className="hover:underline">Health</Link>
        <span>/</span>
        <span className="text-gray-700">Edit Vaccine</span>
        <span className="ml-1 text-gray-400">({id})</span>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Edit Vaccine</h1>
        <Link
          to="/health"
          className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50"
        >
          Back
        </Link>
      </div>

      <div className="rounded-2xl border p-4 md:p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Vaccine Name</label>
            <input
              className="w-full rounded-xl border px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Given On</label>
            <input
              type="date"
              className="w-full rounded-xl border px-3 py-2"
              value={givenOn}
              onChange={(e) => setGivenOn(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Next Due</label>
            <input
              type="date"
              className="w-full rounded-xl border px-3 py-2"
              value={nextDue}
              onChange={(e) => setNextDue(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Notes</label>
          <textarea
            className="w-full rounded-xl border px-3 py-2"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isDisabled}
          className={`w-full px-4 py-2 rounded-xl text-white ${
            isDisabled ? "bg-gray-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          Save
        </button>
      </div>
    </div>
  );
}
