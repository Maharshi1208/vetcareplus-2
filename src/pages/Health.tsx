import React, { useMemo, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

type FlashState = { type: "success" | "error" | "info"; message: string };
type EntryType = "vaccine" | "med";
type HealthEntry = {
  id: string;
  date: string; // YYYY-MM-DD
  pet: string;
  owner: string;
  vet?: string;
  type: EntryType;
  title: string; // e.g. "Rabies", "Flea prevention"
  note?: string; // e.g. "Next due: 2026-08-01", "Bravecto chewable"
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
    vaccine: { label: "Vaccine", cls: "border-emerald-200 bg-emerald-50 text-emerald-700" },
    med: { label: "Medication", cls: "border-amber-200 bg-amber-50 text-amber-700" },
  } as const;
  const x = map[t];
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${x.cls}`}>
      {x.label}
    </span>
  );
}

export default function HealthPage() {
  // flash (one-time)
  const location = useLocation();
  const navigate = useNavigate();
  const [flash, setFlash] = useState<FlashState | null>(null);

  useEffect(() => {
    const s = (location.state as any)?.flash as FlashState | undefined;
    if (s) {
      setFlash(s);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  // filters
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState<"" | EntryType>("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return MOCK_ENTRIES.filter((e) => {
      const matchesText =
        !s ||
        [e.pet, e.owner, e.vet ?? "", e.title, e.note ?? "", e.date, e.type]
          .join(" ")
          .toLowerCase()
          .includes(s);
      const matchesType = !typeFilter || e.type === typeFilter;
      return matchesText && matchesType;
    });
  }, [q, typeFilter]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Health Records</h1>
          <p className="text-sm text-gray-500">Vaccinations and medications (UI-only).</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Stubs for later forms */}
          <Link
            to="#"
            className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
            title="Stub — to be wired later"
          >
            Add Medication
          </Link>
          <Link
            to="#"
            className="rounded-xl bg-blue-600 px-3 py-2 text-sm text-white shadow-sm hover:bg-blue-700"
            title="Stub — to be wired later"
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
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as "" | EntryType)}
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
            <div className="text-sm text-gray-600">No health records match your filter.</div>
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
                    {e.note ? <div className="text-xs text-gray-600">{e.note}</div> : null}
                  </div>

                  <div className="mt-3 flex items-center gap-2 sm:mt-0">
                    <Link
                      to="#"
                      className="rounded-lg border px-3 py-1 text-sm hover:bg-white"
                      title="Stub — to be wired later"
                    >
                      View
                    </Link>
                    <Link
                      to="#"
                      className="rounded-lg bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
                      title="Stub — to be wired later"
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
