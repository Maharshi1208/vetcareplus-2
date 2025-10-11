import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchPetsForHealth, type PetOption } from "../services/dropdowns";
import { HealthAPI, ApiError } from "../services/api";

export default function AddVaccine() {
  const navigate = useNavigate();
  const { role } = useAuth();

  // Pet dropdown
  const [pets, setPets] = useState<PetOption[]>([]);
  const [petId, setPetId] = useState("");

  // Form
  const [name, setName] = useState("");
  const [givenOn, setGivenOn] = useState(""); // yyyy-mm-dd
  const [nextDue, setNextDue] = useState("");
  const [notes, setNotes] = useState("");

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

  const isDisabled = !petId || !name || !givenOn;

  async function handleSave() {
    if (isDisabled) return;

    const isoGiven = new Date(`${givenOn}T00:00:00.000Z`).toISOString();
    const composedNotes = [nextDue ? `Next due: ${nextDue}` : "", notes]
      .filter(Boolean)
      .join(". ");

    try {
      // Send both common field names so either backend shape is satisfied.
      await HealthAPI.createVaccination({
        petId,
        vaccine: name, // some APIs expect 'vaccine'
        date: isoGiven, // some APIs expect 'date'
        // If your backend expects 'name'/'givenAt', it will ignore extras,
        // but if not, adjust your route to map these fields accordingly.
        // @ts-expect-error (extras tolerated by API layer)
        name,
        // @ts-expect-error
        givenAt: isoGiven,
        notes: composedNotes,
      } as any);

      navigate("/health", {
        state: {
          flash: { type: "success", message: `Vaccine “${name}” added.` },
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
        <span className="text-gray-700">Add Vaccine</span>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Add Vaccine</h1>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Vaccine Name</label>
            <input
              className="w-full rounded-xl border px-3 py-2"
              placeholder="Enter vaccine name"
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
              : "bg-gradient-to-r from-indigo-500 to-purple-500 hover:opacity-90"
          }`}
        >
          Save
        </button>
      </div>
    </div>
  );
}
