import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchOwnerDetail, fetchOwnerPets } from "../services/dropdowns";

type Owner = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  pets?: Array<{ id: string; name: string; species: string }>;
};

export default function OwnerDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [owner, setOwner] = useState<Owner>({
    id: id ?? "unknown",
    name: "Loading…",
    pets: [],
  });

  useEffect(() => {
    if (!id) return;

    (async () => {
      try {
        // owner core fields
        const o = await fetchOwnerDetail(id);
        // pets for this owner
        const p = await fetchOwnerPets(id);
        setOwner({
          id: o.id,
          name: (o.name ?? "").trim() || o.email,
          email: o.email,
          phone: o.phone ?? undefined,
          address: o.address ?? undefined,
          notes: o.notes ?? undefined,
          pets: p.map((x) => ({ id: x.id, name: x.name, species: "—" })),
        });
      } catch (e) {
        console.error("Owner detail load failed:", e);
        setOwner({
          id,
          name: "Unknown Owner",
          pets: [],
        });
      }
    })();
  }, [id]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{owner.name}</h1>
          <p className="text-sm text-gray-500">Owner profile (read-only UI).</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/owners/${owner.id}/edit`}
            className="rounded-xl bg-blue-600 px-4 py-2 text-white shadow-sm hover:bg-blue-700"
          >
            Edit
          </Link>
          <Link to="/owners" className="rounded-xl border px-4 py-2 hover:bg-gray-50">
            Back to Owners
          </Link>
        </div>
      </div>

      {/* Details */}
      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="border-b p-4">
          <h2 className="text-base font-medium">Owner Details</h2>
        </div>

        <div className="p-4 sm:p-6 grid gap-4 sm:grid-cols-2">
          <div>
            <div className="text-xs text-gray-500">Email</div>
            <div className="mt-1 rounded-lg border bg-gray-50 px-3 py-2">
              {owner.email || "—"}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Phone</div>
            <div className="mt-1 rounded-lg border bg-gray-50 px-3 py-2">
              {owner.phone || "—"}
            </div>
          </div>
          <div className="sm:col-span-2">
            <div className="text-xs text-gray-500">Address</div>
            <div className="mt-1 rounded-lg border bg-gray-50 px-3 py-2">
              {owner.address || "—"}
            </div>
          </div>
          <div className="sm:col-span-2">
            <div className="text-xs text-gray-500">Notes</div>
            <div className="mt-1 rounded-lg border bg-gray-50 px-3 py-2">
              {owner.notes || "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Pets list */}
      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="border-b p-4">
          <h2 className="text-base font-medium">Pets</h2>
          <p className="text-xs text-gray-500">Pets linked to this owner.</p>
        </div>

        <div className="p-4 sm:p-6">
          {owner.pets && owner.pets.length > 0 ? (
            <ul className="divide-y rounded-xl border">
              {owner.pets.map((pet) => (
                <li key={pet.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <div className="font-medium">{pet.name}</div>
                    <div className="text-xs text-gray-600">{pet.species}</div>
                  </div>
                  <Link
                    to={`/pets/${pet.id}`}
                    className="rounded-lg border px-3 py-1 text-sm hover:bg-gray-50"
                  >
                    View Pet
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-gray-600">No pets linked.</div>
          )}
        </div>
      </div>
    </div>
  );
}
