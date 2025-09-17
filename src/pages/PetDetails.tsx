import React from "react";
import { Link, useParams } from "react-router-dom";

function ageLabel(y?: number | string, m?: number | string) {
  const parts: string[] = [];
  if (y !== undefined && y !== "") parts.push(`${y}y`);
  if (m !== undefined && m !== "") parts.push(`${m}m`);
  return parts.length ? parts.join(" ") : "—";
}

function yesNoBadge(v?: boolean) {
  return (
    <span
      className={
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium " +
        (v ? "bg-green-50 text-green-700 border border-green-200"
           : "bg-gray-50 text-gray-700 border border-gray-200")
      }
    >
      {v ? "Yes" : "No"}
    </span>
  );
}

// UI-only mock pet (replace with real fetch/context later)
const MOCK_PET = {
  id: "pet_001",
  name: "Bruno",
  species: "Dog",
  breed: "Labrador Retriever",
  color: "Brown",
  ageYears: 3,
  ageMonths: 2,
  weightKg: 18.5,
  gender: "MALE" as "MALE" | "FEMALE" | "UNKNOWN",
  ownerName: "Alice",
  microchipId: "9851-0034-221A",
  vaccinated: true,
  neutered: true,
  notes: "Friendly, good with kids. Mild allergy to chicken.",
};

// UI-only mock timeline
type TLType = "appointment" | "vaccine" | "med";
type TLEntry = { id: string; date: string; type: TLType; title: string; note?: string };

const MOCK_TIMELINE: TLEntry[] = [
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

export default function PetDetailsPage() {
  const { id } = useParams();
  const p = { ...MOCK_PET, id: id ?? MOCK_PET.id };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{p.name}</h1>
          <p className="text-sm text-gray-500">Pet profile (read-only UI).</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/pets/${p.id}/edit`}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
          >
            Edit
          </Link>
          <Link to="/pets" className="text-sm underline">
            ← Back to Pets
          </Link>
        </div>
      </div>

      {/* Details card */}
      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="border-b p-4">
          <h2 className="text-base font-medium">Pet Details</h2>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          {/* Species / Breed / Color */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-gray-50 p-3">
              <div className="text-xs text-gray-500">Species</div>
              <div className="font-medium">{p.species}</div>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <div className="text-xs text-gray-500">Breed</div>
              <div className="font-medium">{p.breed ?? "—"}</div>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <div className="text-xs text-gray-500">Color</div>
              <div className="font-medium">{p.color ?? "—"}</div>
            </div>
          </div>

          {/* Age / Weight / Gender */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-gray-50 p-3">
              <div className="text-xs text-gray-500">Age</div>
              <div className="font-medium">{ageLabel(p.ageYears, p.ageMonths)}</div>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <div className="text-xs text-gray-500">Weight</div>
              <div className="font-medium">
                {typeof p.weightKg === "number" ? `${p.weightKg} kg` : "—"}
              </div>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <div className="text-xs text-gray-500">Gender</div>
              <div className="font-medium">
                {p.gender[0] + p.gender.slice(1).toLowerCase()}
              </div>
            </div>
          </div>

          {/* Owner / Microchip */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-gray-50 p-3">
              <div className="text-xs text-gray-500">Owner</div>
              <div className="font-medium">{p.ownerName ?? "—"}</div>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <div className="text-xs text-gray-500">Microchip ID</div>
              <div className="font-medium">{p.microchipId || "—"}</div>
            </div>
          </div>

          {/* Flags */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-gray-50 p-3">
              <div className="text-xs text-gray-500">Vaccinated</div>
              <div className="font-medium">{yesNoBadge(p.vaccinated)}</div>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <div className="text-xs text-gray-500">Neutered / Spayed</div>
              <div className="font-medium">{yesNoBadge(p.neutered)}</div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <div className="text-sm font-medium">Notes</div>
            <div className="mt-1 rounded-lg border bg-white p-3 text-sm text-gray-800">
              {p.notes || "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Timeline card (UI-only) */}
      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="border-b p-4">
          <h2 className="text-base font-medium">Timeline</h2>
          <p className="text-xs text-gray-500">Appointments, vaccinations, and medications.</p>
        </div>

        <div className="p-4 sm:p-6">
          {MOCK_TIMELINE.length === 0 ? (
            <div className="text-sm text-gray-600">No history yet.</div>
          ) : (
            <ul className="space-y-4">
              {MOCK_TIMELINE.map((e) => (
                <li key={e.id} className="flex items-start gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-gray-300" />
                  <div className="flex-1 rounded-xl border bg-gray-50 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm font-medium">{e.title}</div>
                      <div className="text-xs text-gray-500">{e.date}</div>
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
