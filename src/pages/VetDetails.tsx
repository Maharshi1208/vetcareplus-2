import React from "react";
import { Link, useParams } from "react-router-dom";

type Vet = {
  id: string;
  name: string;
  specialty?: string;
  email?: string;
  phone?: string;
  active: boolean;
  bio?: string;
};

const MOCK_VETS: Vet[] = [
  { id: "v1", name: "Dr. Anna Smith", specialty: "Surgery", email: "anna@vetcare.local", phone: "555-1001", active: true, bio: "10+ years in soft-tissue surgery and orthopedics." },
  { id: "v2", name: "Dr. Brian Lee", specialty: "Dermatology", email: "brian@vetcare.local", phone: "555-1002", active: true, bio: "Focus on allergy management and chronic skin issues." },
  { id: "v3", name: "Dr. Carla Gomez", specialty: "Dentistry", email: "carla@vetcare.local", phone: "555-1003", active: false, bio: "Dental cleanings, extractions, and oral surgery." },
];

function statusBadge(ok: boolean) {
  return (
    <span
      className={
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium " +
        (ok ? "bg-green-50 text-green-700 border border-green-200" : "bg-gray-50 text-gray-700 border border-gray-200")
      }
    >
      {ok ? "Active" : "Inactive"}
    </span>
  );
}

export default function VetDetailsPage() {
  const { id } = useParams();
  const vet = MOCK_VETS.find((v) => v.id === id) ?? MOCK_VETS[0];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{vet.name}</h1>
          <p className="text-sm text-gray-500">Veterinarian profile (UI-only mock).</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/vets" className="rounded-lg border px-3 py-1 text-sm hover:bg-gray-50">← Back to Vets</Link>
          <Link
            to={`/vets/${vet.id}/edit`}
            className="rounded-lg bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
          >
            Edit Vet
          </Link>
        </div>
      </div>

      {/* Profile card */}
      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="border-b p-4">
          <h2 className="text-base font-medium">Profile</h2>
        </div>
        <div className="p-4 sm:p-6 grid gap-4 sm:grid-cols-2">
          <div>
            <div className="text-xs text-gray-500">Name</div>
            <div className="mt-1 rounded-lg bg-gray-50 px-3 py-2">{vet.name}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Specialty</div>
            <div className="mt-1 rounded-lg bg-gray-50 px-3 py-2">{vet.specialty ?? "—"}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Email</div>
            <div className="mt-1 rounded-lg bg-gray-50 px-3 py-2">{vet.email ?? "—"}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Phone</div>
            <div className="mt-1 rounded-lg bg-gray-50 px-3 py-2">{vet.phone ?? "—"}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Status</div>
            <div className="mt-1">{statusBadge(vet.active)}</div>
          </div>
          <div className="sm:col-span-2">
            <div className="text-xs text-gray-500">Bio / Notes</div>
            <div className="mt-1 rounded-lg bg-gray-50 px-3 py-2">{vet.bio ?? "—"}</div>
          </div>
        </div>
      </div>

      {/* Availability (placeholder) */}
      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="border-b p-4">
          <h2 className="text-base font-medium">Weekly Availability</h2>
          <p className="text-xs text-gray-500">Placeholder — we’ll wire backend later.</p>
        </div>
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => (
              <div key={d} className="rounded-xl border bg-gray-50 px-3 py-2">
                <div className="text-xs text-gray-500">{d}</div>
                <div className="text-sm mt-1">09:00–12:00</div>
                <div className="text-sm">14:00–17:00</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

