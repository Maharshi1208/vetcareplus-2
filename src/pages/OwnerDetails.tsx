import React from "react";
import { Link, useParams } from "react-router-dom";

type Owner = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  pets?: Array<{ id: string; name: string; species: string }>;
};

const MOCK_OWNERS: Record<string, Owner> = {
  o1: {
    id: "o1",
    name: "Alice Johnson",
    email: "alice@vetcare.local",
    phone: "555-2001",
    address: "12 Maple St",
    notes: "Prefers morning appointments.",
    pets: [
      { id: "p1", name: "Buddy", species: "Dog" },
      { id: "p2", name: "Misty", species: "Cat" },
    ],
  },
  o2: {
    id: "o2",
    name: "Bob Patel",
    email: "bob@vetcare.local",
    phone: "555-2002",
    address: "34 Oak Ave",
    notes: "Allergic to penicillin.",
    pets: [{ id: "p3", name: "Kiwi", species: "Bird" }],
  },
  o3: {
    id: "o3",
    name: "Charlie Lee",
    email: "charlie@vetcare.local",
    phone: "555-2003",
    address: "52 Pine Rd",
    notes: "Inactive profile.",
    pets: [],
  },
};

export default function OwnerDetailsPage() {
  const { id } = useParams();
  const owner: Owner =
    (id && MOCK_OWNERS[id]) ||
    ({
      id: id ?? "unknown",
      name: "Unknown Owner",
      pets: [],
    } as Owner);

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
          <p className="text-xs text-gray-500">Pets linked to this owner (UI-only).</p>
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
