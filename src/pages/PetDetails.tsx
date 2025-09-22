import React, { useEffect, useMemo, useState } from "react";
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

// Normalize backend → frontend fields
function normalizePet(raw: any) {
  return {
    id: String(raw.id ?? raw.ID ?? raw._id ?? ""),
    name: raw.name ?? raw.Name ?? "",
    species: raw.species ?? raw.Species ?? "",
    breed: raw.breed ?? raw.Breed ?? "",
    color: raw.color ?? raw.Color ?? "",
    gender: raw.gender ?? raw.Gender ?? "",
    dob: raw.dob ?? raw.DOB ?? raw.dateOfBirth ?? null,
    ageYears: raw.ageYears ?? raw.age_years ?? null,
    ageMonths: raw.ageMonths ?? raw.age_months ?? null,
    weightKg: raw.weightKg ?? raw.weight_kg ?? null,
    microchipId: raw.microchipId ?? raw.microchip_id ?? null,
    vaccinated: raw.vaccinated ?? raw.isVaccinated ?? null,
    neutered: raw.neutered ?? raw.isNeutered ?? null,
    notes: raw.notes ?? raw.Notes ?? "",
    createdAt: raw.createdAt ?? raw.created_at ?? null,
    updatedAt: raw.updatedAt ?? raw.updated_at ?? null,
  };
}

function computeAge(dob?: string | null) {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let years = now.getFullYear() - d.getFullYear();
  let months = now.getMonth() - d.getMonth();
  if (now.getDate() < d.getDate()) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  if (years < 0) return null;
  return { years, months };
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

  const age = useMemo(() => computeAge(pet?.dob ?? null), [pet?.dob]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!pet) return <div className="p-6">No pet found.</div>;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{pet.name}</h1>
          <p className="text-sm text-gray-500">Pet profile</p>
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
          <Field
            label="DOB"
            value={pet.dob ? new Date(pet.dob).toLocaleDateString() : "—"}
          />
          <Field
            label="Age"
            value={age ? `${age.years}y ${age.months}m` : "—"}
          />
          <Field
            label="Weight"
            value={pet.weightKg ? `${pet.weightKg} kg` : "—"}
          />
          <Field label="Microchip" value={pet.microchipId} />
          <Field label="Vaccinated" value={pet.vaccinated ? "Yes" : "No"} />
          <Field label="Neutered" value={pet.neutered ? "Yes" : "No"} />
          <Field label="Notes" value={pet.notes} />
        </div>
      </Card>

      {/* Metadata */}
      <Card title="Metadata">
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
