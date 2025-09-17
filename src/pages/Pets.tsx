import { Link, useLocation, useNavigate } from "react-router-dom";
import React, { useMemo, useState, useEffect } from "react";
import { usePets } from "../context/PetsContext";

type FlashState = { type: "success" | "error" | "info"; message: string };

function ageLabel(y?: number, m?: number) {
  const parts: string[] = [];
  if (typeof y === "number") parts.push(`${y}y`);
  if (typeof m === "number") parts.push(`${m}m`);
  return parts.length ? parts.join(" ") : "—";
}

function yesNoBadge(v?: boolean) {
  return (
    <span
      className={
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium " +
        (v ? "bg-green-50 text-green-700 border border-green-200" : "bg-gray-50 text-gray-700 border border-gray-200")
      }
    >
      {v ? "Yes" : "No"}
    </span>
  );
}

export default function PetsPage() {
  const { pets, removePet } = usePets();
  const [q, setQ] = useState("");

  // --- Flash banner (one-time) ---
  const location = useLocation();
  const navigate = useNavigate();
  const [flash, setFlash] = useState<FlashState | null>(null);

  useEffect(() => {
    const s = (location.state as any)?.flash as FlashState | undefined;
    if (s) {
      setFlash(s);
      // clear history state so it doesn't reappear on refresh/back
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return pets;
    return pets.filter((p) =>
      [
        p.name,
        p.species,
        p.breed ?? "",
        p.ownerName ?? "",
        p.color ?? "",
        p.microchipId ?? "",
        String(p.ageYears ?? ""),
        String(p.ageMonths ?? ""),
        String(p.weightKg ?? ""),
        p.notes ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(s)
    );
  }, [pets, q]);

  return (
    <div className="p-6">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pets</h1>
          <p className="text-sm text-gray-500">Manage pet profiles and details.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center rounded-full border px-3 py-1 text-sm text-gray-700">
            Total: <span className="ml-1 font-semibold">{pets.length}</span>
          </span>
          <Link
            to="/pets/add"
            className="inline-flex items-center rounded-xl bg-blue-600 px-4 py-2 text-white shadow-sm hover:bg-blue-700"
          >
            <span className="mr-2 text-lg leading-none">＋</span>
            Add Pet
          </Link>
        </div>
      </div>

      {/* Flash banner */}
      {flash && (
        <div className="mt-4 flex items-start justify-between rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
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

      {/* Search */}
      <div className="mt-5">
        <div className="rounded-2xl border bg-white shadow-sm">
          <div className="border-b p-4">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name, species, breed, color, owner, microchip…"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
            />
          </div>

          {/* Content */}
          {filtered.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-gray-600">No pets found.</p>
              <Link
                to="/pets/add"
                className="mt-4 inline-flex items-center rounded-xl bg-blue-600 px-4 py-2 text-white shadow-sm hover:bg-blue-700"
              >
                Add your first pet
              </Link>
            </div>
          ) : (
            <div className="p-2 sm:p-4">
              {/* MOBILE — cards */}
              <div className="md:hidden space-y-3">
                {filtered.map((p) => (
                  <div key={p.id} className="rounded-xl border bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-base font-semibold">{p.name}</div>
                        <div className="text-sm text-gray-500">
                          <span className="mr-2 inline-flex items-center rounded-full border px-2 py-0.5 text-xs">
                            {p.species}
                          </span>
                          {p.breed ? <span className="text-gray-500">• {p.breed}</span> : null}
                        </div>
                      </div>
                      {/* Actions: View / Edit / Delete */}
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/pets/${p.id}`}
                          className="rounded-lg border px-3 py-1 text-sm hover:bg-gray-50"
                        >
                          View
                        </Link>
                        <Link
                          to={`/pets/${p.id}/edit`}
                          className="rounded-lg bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => removePet(p.id)}
                          className="rounded-lg px-3 py-1.5 text-red-600 hover:bg-red-50 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div className="rounded-lg bg-gray-50 px-3 py-2">
                        <div className="text-gray-500">Age</div>
                        <div className="font-medium">
                          {ageLabel(p.ageYears, p.ageMonths)}
                        </div>
                      </div>
                      <div className="rounded-lg bg-gray-50 px-3 py-2">
                        <div className="text-gray-500">Weight</div>
                        <div className="font-medium">
                          {typeof p.weightKg === "number" ? `${p.weightKg} kg` : "—"}
                        </div>
                      </div>
                      <div className="rounded-lg bg-gray-50 px-3 py-2">
                        <div className="text-gray-500">Owner</div>
                        <div className="font-medium">{p.ownerName ?? "—"}</div>
                      </div>
                      <div className="rounded-lg bg-gray-50 px-3 py-2">
                        <div className="text-gray-500">Color</div>
                        <div className="font-medium">{p.color ?? "—"}</div>
                      </div>
                      <div className="rounded-lg bg-gray-50 px-3 py-2">
                        <div className="text-gray-500">Vaccinated</div>
                        <div className="font-medium">{yesNoBadge(p.vaccinated)}</div>
                      </div>
                      <div className="rounded-lg bg-gray-50 px-3 py-2">
                        <div className="text-gray-500">Neutered</div>
                        <div className="font-medium">{yesNoBadge(p.neutered)}</div>
                      </div>
                    </div>

                    {p.microchipId || p.notes ? (
                      <div className="mt-3 grid gap-2">
                        {p.microchipId ? (
                          <div className="text-xs text-gray-600">
                            <span className="font-medium">Microchip:</span> {p.microchipId}
                          </div>
                        ) : null}
                        {p.notes ? (
                          <div className="text-xs text-gray-600">
                            <span className="font-medium">Notes:</span>{" "}
                            <span title={p.notes}>
                              {p.notes.length > 80 ? p.notes.slice(0, 80) + "…" : p.notes}
                            </span>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>

              {/* DESKTOP — table */}
              <div className="hidden md:block">
                <div className="overflow-auto rounded-2xl border bg-white shadow-sm">
                  <table className="min-w-full">
                    <thead className="bg-gray-50 text-left text-sm text-gray-600">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Name</th>
                        <th className="px-4 py-3 font-semibold">Species / Breed</th>
                        <th className="px-4 py-3 font-semibold">Color</th>
                        <th className="px-4 py-3 font-semibold">Age</th>
                        <th className="px-4 py-3 font-semibold">Weight</th>
                        <th className="px-4 py-3 font-semibold">Owner</th>
                        <th className="px-4 py-3 font-semibold">Vaccinated</th>
                        <th className="px-4 py-3 font-semibold">Neutered</th>
                        <th className="px-4 py-3 font-semibold">Microchip</th>
                        <th className="px-4 py-3 font-semibold">Notes</th>
                        <th className="px-4 py-3 text-right font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-sm">
                      {filtered.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">{p.name}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">
                                {p.species}
                              </span>
                              <span className="text-gray-700">{p.breed ?? "—"}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">{p.color ?? "—"}</td>
                          <td className="px-4 py-3">{ageLabel(p.ageYears, p.ageMonths)}</td>
                          <td className="px-4 py-3">
                            {typeof p.weightKg === "number" ? `${p.weightKg} kg` : "—"}
                          </td>
                          <td className="px-4 py-3">{p.ownerName ?? "—"}</td>
                          <td className="px-4 py-3">{yesNoBadge(p.vaccinated)}</td>
                          <td className="px-4 py-3">{yesNoBadge(p.neutered)}</td>
                          <td className="px-4 py-3">{p.microchipId || "—"}</td>
                          <td className="px-4 py-3">
                            {p.notes ? (
                              <span title={p.notes}>
                                {p.notes.length > 40 ? p.notes.slice(0, 40) + "…" : p.notes}
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                          {/* Actions: View / Edit / Delete */}
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-2">
                              <Link
                                to={`/pets/${p.id}`}
                                className="rounded-lg border px-3 py-1 text-sm hover:bg-gray-50"
                              >
                                View
                              </Link>
                              <Link
                                to={`/pets/${p.id}/edit`}
                                className="rounded-lg bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
                              >
                                Edit
                              </Link>
                              <button
                                onClick={() => removePet(p.id)}
                                className="rounded-lg px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {/* /DESKTOP */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
