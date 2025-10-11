import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchPetsForHealth, type PetOption } from "../services/dropdowns";
import { HealthAPI, ApiError } from "../services/api";

export default function AddMedication() {
  const navigate = useNavigate();
  const { role } = useAuth();

  // --- Pet dropdown ---
  const [pets, setPets] = useState<PetOption[]>([]);
  const [petId, setPetId] = useState("");

  // --- Form state ---
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [duration, setDuration] = useState(""); // days (string)
  const [notes, setNotes] = useState("");

  // Load pets
  useEffect(() => {
    (async () => {
      try {
        const list = await fetchPetsForHealth(role ?? null);
        setPets(list);
        if (list.length) setPetId(list[0].id);
      } catch (e) {
        console.error("load pets failed", e);
        setPets([]);
      }
    })();
  }, [role]);

  const parseDays = (raw: string): number | null => {
    if (!raw) return null;
    const n = Number(raw);
    if (!Number.isFinite(n)) return null;
    const i = Math.floor(n);
    return i > 0 ? i : null;
  };

  const clean = (s: string) => s.trim();

  const isDisabled =
    !petId || !clean(name) || !clean(dosage) || parseDays(duration) === null;

  async function handleSave() {
    if (isDisabled) {
      if (parseDays(duration) === null) {
        alert("Duration must be a positive whole number of days (e.g. 7).");
      }
      return;
    }

    const durationDays = parseDays(duration)!; // safe due to isDisabled guard
    const composedNotes = [clean(frequency), clean(notes)].filter(Boolean).join(" — ");

    try {
      await HealthAPI.createMedication({
        petId,
        name: clean(name),
        dosage: clean(dosage),
        frequency: clean(frequency) || "as directed",
        startAt: new Date().toISOString(), // backend requires startAt
        durationDays,
        notes: composedNotes,
      });

      navigate("/health", {
        state: {
          flash: { type: "success", message: `Medication “${clean(name)}” added.` },
        },
      });
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.message || `HTTP ${e.status}`
          : (e as any)?.message || "Network error";
      alert(msg);
    }
  }

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
        {/* Pet */}
        <div>
          <label className="block text-sm text-gray-600 mb-1">Pet</label>
          <select
            className="w-full rounded-xl border px-3 py-2"
            value={petId}
            onChange={(e) => setPetId(e.target.value)}
          >
            {pets.length === 0 ? (
              <option value="">No pets available</option>
            ) : (
              pets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {"ownerName" in p && (p as any).ownerName ? ` — ${(p as any).ownerName}` : ""}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Form grid */}
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
            <label className="block text-sm text-gray-600 mb-1">Duration (days)</label>
            <input
              className="w-full rounded-xl border px-3 py-2"
              placeholder="e.g. 7"
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
          className={`w-full px-4 py-2 rounded-xl text-white shadow-sm ${
            isDisabled
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-gradient-to-r from-sky-500 to-emerald-500 hover:opacity-90"
          }`}
        >
          Save
        </button>
      </div>
    </div>
  );
}
