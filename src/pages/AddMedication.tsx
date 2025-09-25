import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function AddMedication() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");

  const handleSave = () => {
    const newEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString().split("T")[0],
      pet: "Demo Pet",
      owner: "Demo Owner",
      vet: "Demo Vet",
      type: "med" as const,
      title: name,
      note: `${dosage}, ${frequency}, ${duration}, ${notes}`,
    };

    navigate("/health", {
      state: {
        flash: { type: "success", message: `Medication "${name}" added.` },
        newEntry,
      },
    });
  };

  const isDisabled = !name || !dosage;

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-500 flex items-center gap-2">
        <Link to="/health" className="hover:underline">Health</Link>
        <span>/</span>
        <span className="text-gray-700">Add Medication</span>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Add Medication</h1>
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
            <label className="block text-sm text-gray-600 mb-1">Medication Name</label>
            <input
              className="w-full rounded-xl border px-3 py-2"
              placeholder="Enter medication name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Dosage</label>
            <input
              className="w-full rounded-xl border px-3 py-2"
              placeholder="e.g. 5mg"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Frequency</label>
            <input
              className="w-full rounded-xl border px-3 py-2"
              placeholder="e.g. Twice a day"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Duration</label>
            <input
              className="w-full rounded-xl border px-3 py-2"
              placeholder="e.g. 7 days"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Notes</label>
          <textarea
            className="w-full rounded-xl border px-3 py-2"
            rows={3}
            placeholder="Additional notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isDisabled}
          className={`w-full px-4 py-2 rounded-xl text-white ${
            isDisabled
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          Save
        </button>
      </div>
    </div>
  );
}
