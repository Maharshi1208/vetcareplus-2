// src/pages/PetDetails.tsx
import React, { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

// ---- Existing mock pet (kept) ----
const MOCK_PET = {
  id: "p-1",
  name: "Buddy",
  species: "Dog",
  breed: "Labrador Retriever",
  gender: "MALE",
  color: "Golden",
  ageYears: 4,
  ageMonths: 2,
  weightKg: 28.5,
  ownerName: "Alice",
  microchipId: "9851-0034-221A",
  vaccinated: true,
  neutered: true,
  notes: "Friendly, good with kids. Mild allergy to chicken.",
};

// ---- Timeline types ----
type TLType = "appointment" | "vaccine" | "med";
type TLEntry = { id: string; date: string; type: TLType; title: string; note?: string };

// Initial (UI-only) timeline
const INITIAL_TIMELINE: TLEntry[] = [
  { id: "tl3", date: "2025-09-10", type: "appointment", title: "Checkup with Dr. Smith", note: "General exam" },
  { id: "tl2", date: "2025-08-01", type: "vaccine", title: "Rabies Booster", note: "Next due: 2026-08-01" },
  { id: "tl1", date: "2025-07-15", type: "med", title: "Flea prevention", note: "Bravecto chewable" },
];

function typeBadge(t: TLType) {
  const map = {
    appointment: { label: "Appointment", cls: "border-sky-200 bg-sky-50 text-sky-700" },
    vaccine: { label: "Vaccine", cls: "border-emerald-200 bg-emerald-50 text-emerald-700" },
    med: { label: "Medication", cls: "border-amber-200 bg-amber-50 text-amber-700" },
  } as const;
  const info = map[t];
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${info.cls}`}>
      {info.label}
    </span>
  );
}

function ageLabel(y?: number, m?: number) {
  const parts: string[] = [];
  if (typeof y === "number") parts.push(`${y}y`);
  if (typeof m === "number") parts.push(`${m}m`);
  return parts.length ? parts.join(" ") : "—";
}

// Small helper for ids (UI-only)
function uid(prefix: string = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function PetDetailsPage() {
  const { id } = useParams();
  const p = { ...MOCK_PET, id: id ?? MOCK_PET.id };

  // ---- Timeline state (with initial items) ----
  const [timeline, setTimeline] = useState<TLEntry[]>(INITIAL_TIMELINE);

  // ---- Local UI: which add-form is open ----
  const [showVacForm, setShowVacForm] = useState(false);
  const [showMedForm, setShowMedForm] = useState(false);

  // ---- Vaccine form state ----
  const [vac, setVac] = useState({
    date: new Date().toISOString().slice(0, 10),
    name: "",
    note: "",
    nextDue: "",
  });

  // ---- Medication form state ----
  const [med, setMed] = useState({
    date: new Date().toISOString().slice(0, 10),
    name: "",
    dosage: "",
    duration: "",
    note: "",
  });

  // Sorted timeline (latest first)
  const sorted = useMemo(() => {
    return [...timeline].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  }, [timeline]);

  function addVaccine(e: React.FormEvent) {
    e.preventDefault();
    if (!vac.name.trim()) return;

    const note = [vac.note.trim(), vac.nextDue ? `Next due: ${vac.nextDue}` : ""]
      .filter(Boolean)
      .join(" • ");

    const entry: TLEntry = {
      id: uid("vac"),
      date: vac.date,
      type: "vaccine",
      title: vac.name.trim(),
      note: note || undefined,
    };
    setTimeline((t) => [entry, ...t]);
    setShowVacForm(false);
    setVac({
      date: new Date().toISOString().slice(0, 10),
      name: "",
      note: "",
      nextDue: "",
    });
  }

  function addMedication(e: React.FormEvent) {
    e.preventDefault();
    if (!med.name.trim()) return;

    const noteParts = [
      med.dosage ? `Dosage: ${med.dosage}` : "",
      med.duration ? `Duration: ${med.duration}` : "",
      med.note.trim(),
    ].filter(Boolean);
    const entry: TLEntry = {
      id: uid("med"),
      date: med.date,
      type: "med",
      title: med.name.trim(),
      note: noteParts.join(" • ") || undefined,
    };
    setTimeline((t) => [entry, ...t]);
    setShowMedForm(false);
    setMed({
      date: new Date().toISOString().slice(0, 10),
      name: "",
      dosage: "",
      duration: "",
      note: "",
    });
  }

  // ---- NEW: tiny delete (UI-only) ----
  function removeEntry(entryId: string) {
    setTimeline((t) => t.filter((x) => x.id !== entryId));
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{p.name}</h1>
          <p className="text-sm text-gray-500">Pet profile (read-only data; timeline is UI-only).</p>
        </div>
        <Link to="/pets" className="text-sm underline">
          ← Back to Pets
        </Link>
      </div>

      {/* Details card (kept) */}
      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="border-b p-4">
          <h2 className="text-base font-medium">Pet Details</h2>
        </div>
        <div className="p-4 sm:p-6">
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-xs uppercase text-gray-500">Species</dt>
              <dd className="text-sm">{p.species}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-gray-500">Breed</dt>
              <dd className="text-sm">{p.breed ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-gray-500">Gender</dt>
              <dd className="text-sm">{p.gender}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-gray-500">Color</dt>
              <dd className="text-sm">{p.color ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-gray-500">Age</dt>
              <dd className="text-sm">{ageLabel(p.ageYears, p.ageMonths)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-gray-500">Weight</dt>
              <dd className="text-sm">{typeof p.weightKg === "number" ? `${p.weightKg} kg` : "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-gray-500">Owner</dt>
              <dd className="text-sm">{p.ownerName ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-gray-500">Microchip ID</dt>
              <dd className="text-sm">{p.microchipId ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-gray-500">Vaccinated</dt>
              <dd className="text-sm">{p.vaccinated ? "Yes" : "No"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-gray-500">Neutered / Spayed</dt>
              <dd className="text-sm">{p.neutered ? "Yes" : "No"}</dd>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <dt className="text-xs uppercase text-gray-500">Notes</dt>
              <dd className="text-sm">{p.notes ?? "—"}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Timeline + Add forms */}
      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h2 className="text-base font-medium">Timeline</h2>
            <p className="text-xs text-gray-500">Appointments, vaccinations, and medications.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setShowVacForm((v) => !v); setShowMedForm(false); }}
              className="rounded-xl border px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              {showVacForm ? "Close Vaccine Form" : "Add Vaccine"}
            </button>
            <button
              onClick={() => { setShowMedForm((v) => !v); setShowVacForm(false); }}
              className="rounded-xl border px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              {showMedForm ? "Close Medication Form" : "Add Medication"}
            </button>
          </div>
        </div>

        {/* Forms (toggle) */}
        {(showVacForm || showMedForm) && (
          <div className="border-b p-4 sm:p-6">
            {showVacForm && (
              <form onSubmit={addVaccine} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600">Date</label>
                  <input
                    type="date"
                    value={vac.date}
                    onChange={(e) => setVac((f) => ({ ...f, date: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">Vaccine Name *</label>
                  <input
                    value={vac.name}
                    onChange={(e) => setVac((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Rabies, DHPP, Bordetella…"
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">Next Due (optional)</label>
                  <input
                    type="date"
                    value={vac.nextDue}
                    onChange={(e) => setVac((f) => ({ ...f, nextDue: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
                  />
                </div>
                <div className="lg:col-span-3">
                  <label className="block text-xs font-medium text-gray-600">Note (optional)</label>
                  <input
                    value={vac.note}
                    onChange={(e) => setVac((f) => ({ ...f, note: e.target.value }))}
                    placeholder="Any observations…"
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
                  />
                </div>
                <div className="lg:col-span-3">
                  <button
                    type="submit"
                    className="rounded-xl bg-blue-600 px-4 py-2 text-white shadow-sm hover:bg-blue-700"
                  >
                    Save Vaccine
                  </button>
                </div>
              </form>
            )}

            {showMedForm && (
              <form onSubmit={addMedication} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600">Date</label>
                  <input
                    type="date"
                    value={med.date}
                    onChange={(e) => setMed((f) => ({ ...f, date: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">Medication Name *</label>
                  <input
                    value={med.name}
                    onChange={(e) => setMed((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Amoxicillin, Bravecto…"
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">Dosage</label>
                  <input
                    value={med.dosage}
                    onChange={(e) => setMed((f) => ({ ...f, dosage: e.target.value }))}
                    placeholder="e.g., 50mg twice daily"
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">Duration</label>
                  <input
                    value={med.duration}
                    onChange={(e) => setMed((f) => ({ ...f, duration: e.target.value }))}
                    placeholder="e.g., 7 days"
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
                  />
                </div>
                <div className="lg:col-span-2">
                  <label className="block text-xs font-medium text-gray-600">Note (optional)</label>
                  <input
                    value={med.note}
                    onChange={(e) => setMed((f) => ({ ...f, note: e.target.value }))}
                    placeholder="Any instructions or observations…"
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
                  />
                </div>
                <div className="lg:col-span-3">
                  <button
                    type="submit"
                    className="rounded-xl bg-blue-600 px-4 py-2 text-white shadow-sm hover:bg-blue-700"
                  >
                    Save Medication
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Timeline list */}
        <div className="p-4 sm:p-6">
          {sorted.length === 0 ? (
            <div className="text-sm text-gray-600">No history yet.</div>
          ) : (
            <ul className="space-y-4">
              {sorted.map((e) => (
                <li key={e.id} className="flex items-start gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-gray-300" />
                  <div className="flex-1 rounded-xl border bg-gray-50 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm font-medium">{e.title}</div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-gray-500">{e.date}</div>
                        {/* tiny delete button */}
                        <button
                          onClick={() => removeEntry(e.id)}
                          className="rounded-md px-2 py-1 text-xs text-rose-700 hover:bg-rose-50"
                          title="Remove from timeline (UI-only)"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      {typeBadge(e.type)}
                      {e.note ? <span className="text-xs text-gray-600">• {e.note}</span> : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
