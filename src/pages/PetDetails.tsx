import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

const API_BASE = "http://localhost:4000";
const PETS_URL = `${API_BASE}/pets`;

function getToken() {
  try {
    return localStorage.getItem("token");
  } catch {
    return null;
  }
}

function createHeaders() {
  const h: Record<string, string> = { Accept: "application/json" };
  const token = getToken();
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function http<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: createHeaders() });
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const msg = data?.message || data?.error || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data as T;
}

function normalizePet(raw: any) {
  return {
    id: String(raw.id ?? ""),
    name: raw.name ?? "",
    species: raw.species ?? "",
    breed: raw.breed ?? "",
    color: raw.color ?? "",
    gender: raw.gender ?? "",
    ageYears: raw.ageYears ?? null,
    ageMonths: raw.ageMonths ?? null,
    weightKg: raw.weightKg ?? null,
    ownerName: raw.ownerName ?? "",
    microchipId: raw.microchipId ?? null,
    vaccinated: raw.vaccinated ?? false,
    neutered: raw.neutered ?? false,
    notes: raw.notes ?? "",
    createdAt: raw.createdAt ?? null,
    updatedAt: raw.updatedAt ?? null,
  };
}

export default function PetDetailsPage() {
  const { id } = useParams();
  const [pet, setPet] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await http<any>(`${PETS_URL}/${id}`);
        const p = normalizePet(data.pet ?? data);
        if (!cancelled) setPet(p);
      } catch (e: any) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (id) load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!pet) return <div className="p-6">No pet found.</div>;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{pet.name}</h1>
          <p className="text-sm text-gray-500">{pet.species} profile</p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/pets"
            className="rounded-lg border px-3 py-1 text-sm hover:bg-gray-50"
          >
            ← Back
          </Link>
          <Link
            to={`/pets/${pet.id}/edit`}
            className="rounded-lg bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
          >
            Edit
          </Link>
        </div>
      </div>

      {/* Profile Card */}
      <Card title="Profile">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" value={pet.name} />
          <Field label="Species" value={pet.species} />
          <Field label="Breed" value={pet.breed} />
          <Field label="Color" value={pet.color} />
          <Field label="Gender" value={pet.gender} />
          <Field label="Age (Years)" value={pet.ageYears != null ? String(pet.ageYears) : "—"} />
          <Field label="Age (Months)" value={pet.ageMonths != null ? String(pet.ageMonths) : "—"} />
          <Field label="Weight (kg)" value={pet.weightKg != null ? `${pet.weightKg} kg` : "—"} />
          <Field label="Owner" value={pet.ownerName} />
          <Field label="Microchip ID" value={pet.microchipId} />
          <Field label="Vaccinated" value={pet.vaccinated ? "Yes" : "No"} />
          <Field label="Neutered" value={pet.neutered ? "Yes" : "No"} />
          <Field label="Notes" value={pet.notes} />
        </div>
      </Card>

      {/* Metadata */}
      <Card title="System Info">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Created At"
            value={pet.createdAt ? new Date(pet.createdAt).toLocaleString() : "—"}
          />
          <Field
            label="Updated At"
            value={pet.updatedAt ? new Date(pet.updatedAt).toLocaleString() : "—"}
          />
        </div>
      </Card>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-white shadow-sm">
      <div className="border-b p-4">
        <h2 className="text-base font-medium">{title}</h2>
      </div>
      <div className="p-4 sm:p-6">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 rounded-lg bg-gray-50 px-3 py-2">{value ?? "—"}</div>
    </div>
  );
}