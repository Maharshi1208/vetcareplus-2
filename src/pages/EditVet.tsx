import React, { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

type Vet = {
  id: string;
  name: string;
  specialty?: string;
  email?: string;
  phone?: string;
  active: boolean;
  bio?: string;
};

// UI-only seed (same ids as your list)
const MOCK_VETS: Record<string, Vet> = {
  v1: {
    id: "v1",
    name: "Dr. Anna Smith",
    specialty: "Surgery",
    email: "anna@vetcare.local",
    phone: "555-1001",
    active: true,
    bio: "Board-certified surgeon with 10+ years experience.",
  },
  v2: {
    id: "v2",
    name: "Dr. Brian Lee",
    specialty: "Dermatology",
    email: "brian@vetcare.local",
    phone: "555-1002",
    active: true,
    bio: "Focus on allergy management and skin diseases.",
  },
  v3: {
    id: "v3",
    name: "Dr. Carla Gomez",
    specialty: "Dentistry",
    email: "carla@vetcare.local",
    phone: "555-1003",
    active: false,
    bio: "Dental care specialist.",
  },
};

export default function EditVetPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();

  const initial: Vet | undefined = useMemo(() => {
    return MOCK_VETS[id] ?? {
      id,
      name: "",
      specialty: "",
      email: "",
      phone: "",
      active: true,
      bio: "",
    };
  }, [id]);

  const [form, setForm] = useState({
    name: initial?.name ?? "",
    specialty: initial?.specialty ?? "",
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
    active: initial?.active ?? true,
    bio: initial?.bio ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function set<K extends keyof typeof form>(k: K, v: any) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 2) e.name = "Name must be at least 2 characters.";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email.";
    if (form.phone && !/^[0-9\-+\s()]{7,}$/.test(form.phone)) e.phone = "Invalid phone.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;

    // UI-only: no API, just navigate back with a flash
    // eslint-disable-next-line no-console
    console.log("EditVetPage submit (UI-only):", { id, ...form });

    navigate("/vets", {
      state: { flash: { type: "success", message: "Vet updated" } },
    });
  }

  function onReset() {
    setForm({
      name: initial?.name ?? "",
      specialty: initial?.specialty ?? "",
      email: initial?.email ?? "",
      phone: initial?.phone ?? "",
      active: initial?.active ?? true,
      bio: initial?.bio ?? "",
    });
    setErrors({});
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Edit Vet</h1>
          <p className="text-sm text-gray-500">Update veterinarian profile (UI-only).</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/vets" className="text-sm underline">← Back to Vets</Link>
          <Link to={`/vets/${id}`} className="text-sm underline">View</Link>
        </div>
      </div>

      {/* Card */}
      <div className="rounded-2xl border bg-white shadow-sm">
        <form onSubmit={onSubmit}>
          <div className="border-b p-4">
            <h2 className="text-base font-medium">Vet Details</h2>
          </div>

          <div className="p-4 sm:p-6 space-y-6">
            {/* Name / Specialty */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium">Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
                  placeholder="Dr. Jane Doe"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium">Specialty</label>
                <input
                  value={form.specialty}
                  onChange={(e) => set("specialty", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
                  placeholder="Surgery, Dermatology…"
                />
              </div>
            </div>

            {/* Email / Phone */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium">Email</label>
                <input
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
                  placeholder="dr.jane@vetcare.local"
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium">Phone</label>
                <input
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
                  placeholder="555-1004"
                />
                {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
              </div>
            </div>

            {/* Active */}
            <div>
              <label className="inline-flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => set("active", e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm">Active</span>
              </label>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium">Bio / Notes</label>
              <textarea
                value={form.bio}
                onChange={(e) => set("bio", e.target.value)}
                rows={4}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
                placeholder="Short background, areas of interest…"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t p-4 sm:flex-row sm:justify-end">
            <button type="button" onClick={onReset} className="rounded-xl border px-4 py-2">
              Reset
            </button>
            <button type="submit" className="rounded-xl bg-blue-600 px-5 py-2 text-white shadow-sm hover:bg-blue-700">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
