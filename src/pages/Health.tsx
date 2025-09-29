// src/pages/Health.tsx
import React, { useMemo, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { fetchOwnerPets, type PetOption } from "../services/dropdowns";

type FlashState = { type: "success" | "error" | "info"; message: string };
type EntryType = "vaccine" | "med";
type HealthEntry = {
  id: string;
  date: string; // YYYY-MM-DD
  pet: string;
  owner: string;
  vet?: string;
  type: EntryType;
  title: string;
  note?: string;
};

// ---- UI-only mock data ----
const MOCK_ENTRIES: HealthEntry[] = [
  {
    id: "h3",
    date: "2025-09-10",
    pet: "Buddy",
    owner: "Alice Johnson",
    vet: "Dr. Anna Smith",
    type: "vaccine",
    title: "DHPP booster",
    note: "Next due: 2026-09-10",
  },
  {
    id: "h2",
    date: "2025-08-01",
    pet: "Misty",
    owner: "Alice Johnson",
    vet: "Dr. Brian Lee",
    type: "vaccine",
    title: "Rabies",
    note: "Next due: 2026-08-01",
  },
  {
    id: "h1",
    date: "2025-07-15",
    pet: "Kiwi",
    owner: "Bob Patel",
    vet: "Dr. Carla Gomez",
    type: "med",
    title: "Flea prevention",
    note: "Bravecto chewable",
  },
];

function typeBadge(t: EntryType) {
  const map = {
    vaccine: {
      label: "Vaccine",
      cls: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
    med: {
      label: "Medication",
      cls: "border-amber-200 bg-amber-50 text-amber-700",
    },
  } as const;
  const x = map[t];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${x.cls}`}
    >
      {x.label}
    </span>
  );
}

export default function HealthPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [flash, setFlash] = useState<FlashState | null>(null);
  const [entries, setEntries] = useState<HealthEntry[]>(MOCK_ENTRIES);

  useEffect(() => {
    const s = (location.state as any)?.flash as FlashState | undefined;
    const newEntry = (location.state as any)?.newEntry as
      | HealthEntry
      | undefined;

    if (s) setFlash(s);

    if (newEntry) {
      setEntries((prev) => {
        const exists = prev.find((e) => e.id === newEntry.id);
        if (exists) {
          return prev.map((e) => (e.id === newEntry.id ? newEntry : e));
        } else {
          return [newEntry, ...prev];
        }
      });
    }

    if (s || newEntry) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  // --- Filters ---
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState<"" | EntryType>("");
  const [pets, setPets] = useState<PetOption[]>([]);
  const [petFilter, setPetFilter] = useState<string>("");

  // Load current owner's pets for the dropdown (array: [{id,name,ownerId}])
  useEffect(() => {
    fetchOwnerPets("me").then(setPets).catch(console.error);
  }, []);

  // Map selected petId to its name (entries store pet names)
  const selectedPetName = useMemo(
    () => pets.find((p) => p.id === petFilter)?.name ?? "",
    [petFilter, pets]
  );

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return entries.filter((e) => {
      const matchesText =
        !s ||
        [e.pet, e.owner, e.vet ?? "", e.title, e.note ?? "", e.date, e.type]
          .join(" ")
          .toLowerCase()
          .includes(s);
      const matchesType = !typeFilter || e.type === typeFilter;
      const matchesPet =
        !petFilter || (selectedPetName && e.pet.toLowerCase() === selectedPetName.toLowerCase());
      return matchesText && matchesType && matchesPet;
    });
  }, [q, typeFilter, petFilter, selectedPetName, entries]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Health Records
          </h1>
          <p className="text-sm text-gray-500">
            Vaccinations and medications (UI-only).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/health/add-medication"
            className="rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 px-4 py-2 text-sm text-white shadow-sm hover:opacity-90"
          >
            Add Medication
          </Link>
          <Link
            to="/health/add-vaccine"
            className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-2 text-sm text-white shadow-sm hover:opacity-90"
          >
            Add Vaccine
          </Link>
        </div>
      </div>

      {/* Flash */}
      {flash && (
        <div className="flex items-start justify-between rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
            <span className="font-medium">{flash.message}</span>
          </div>
          <button
            onClick={() => setFlash(null)}
            className="rounded-md px-2 py-1 text-green-700 hover:bg-green-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="border-b p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by pet, owner, vet, title, note…"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400 sm:max-w-md"
            />
            <div className="flex items-center gap-2">
              {/* NEW: Pet filter (keeps layout; sits next to Type) */}
              <select
                value={petFilter}
                onChange={(e) => setPetFilter(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
              >
                <option value="">All pets</option>
                {pets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              <select
                value={typeFilter}
                onChange={(e) =>
                  setTypeFilter(e.target.value as "" | EntryType)
                }
                className="rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
              >
                <option value="">All types</option>
                <option value="vaccine">Vaccine</option>
                <option value="med">Medication</option>
              </select>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="p-4 sm:p-6">
          {filtered.length === 0 ? (
            <div className="text-sm text-gray-600">
              No health records match your filter.
            </div>
          ) : (
            <ul className="space-y-3">
              {filtered.map((e) => (
                <li
                  key={e.id}
                  className="rounded-xl border bg-gray-50 p-3 sm:flex sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium">{e.title}</div>
                      {typeBadge(e.type)}
                    </div>
                    <div className="text-xs text-gray-600">
                      <span className="font-medium">{e.pet}</span> • {e.owner}
                      {e.vet ? <> • {e.vet}</> : null} • {e.date}
                    </div>
                    {e.note ? (
                      <div className="text-xs text-gray-600">{e.note}</div>
                    ) : null}
                  </div>

                  <div className="mt-3 flex items-center gap-2 sm:mt-0">
                    <Link
                      to={`/vaccines/${e.id}/view`}
                      state={{ entry: e }}
                      className="rounded-lg bg-gradient-to-r from-sky-500 to-emerald-500 px-3 py-1 text-sm text-white shadow-sm hover:opacity-90"
                    >
                      View
                    </Link>
                    <Link
                      to={`/vaccines/${e.id}/edit`}
                      state={{ entry: e }}
                      className="rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 px-3 py-1 text-sm text-white shadow-sm hover:opacity-90"
                    >
                      Edit
                    </Link>
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
