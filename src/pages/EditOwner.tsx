import React, { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

type Owner = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  status?: "Active" | "Inactive";
};

// same seed as Details page (light)
const MOCK: Record<string, Owner> = {
  o1: { id: "o1", name: "Alice Johnson", email: "alice@vetcare.local", phone: "555-2001", address: "12 Maple St", notes: "Prefers morning appointments.", status: "Active" },
  o2: { id: "o2", name: "Bob Patel",   email: "bob@vetcare.local",   phone: "555-2002", address: "34 Oak Ave",     notes: "Allergic to penicillin.",   status: "Active" },
  o3: { id: "o3", name: "Charlie Lee",  email: "charlie@vetcare.local", phone: "555-2003", address: "52 Pine Rd",    notes: "Inactive profile.",         status: "Inactive" },
};

const STATUSES: Array<Owner["status"]> = ["Active", "Inactive"];

export default function EditOwnerPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const seed: Owner = useMemo(() => {
    const base = (id && MOCK[id]) || ({ id: id ?? "unknown", name: "" } as Owner);
    return { ...base };
  }, [id]);

  const [form, setForm] = useState({
    name: seed.name || "",
    email: seed.email || "",
    phone: seed.phone || "",
    address: seed.address || "",
    notes: seed.notes || "",
    status: (seed.status ?? "Active") as "Active" | "Inactive",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function set<K extends keyof typeof form>(k: K, v: any) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 2) e.name = "Name must be at least 2 characters.";
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email.";
    if (form.phone && !/^[\d\s\-()+]{7,}$/.test(form.phone)) e.phone = "Enter a valid phone.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;

    // UI-only (no API yet)
    // eslint-disable-next-line no-console
    console.log("EditOwner submit (UI-only):", { id, ...form });

    navigate("/owners", {
      state: { flash: { type: "success", message: "Owner updated" } },
    });
  }

  function onReset() {
    setForm({
      name: seed.name || "",
      email: seed.email || "",
      phone: seed.phone || "",
      address: seed.address || "",
      notes: seed.notes || "",
      status: (seed.status ?? "Active") as "Active" | "Inactive",
    });
    setErrors({});
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Edit Owner</h1>
          <p className="text-sm text-gray-500">Update owner profile (UI-only).</p>
        </div>
        <Link to="/owners" className="rounded-xl border px-4 py-2 hover:bg-gray-50">
          ← Back to Owners
        </Link>
      </div>

      {/* Card */}
      <div className="rounded-2xl border bg-white shadow-sm">
        <form onSubmit={onSubmit}>
          <div className="border-b p-4">
            <h2 className="text-base font-medium">Owner Details</h2>
          </div>

          <div className="p-4 sm:p-6 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium">Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
                  placeholder="e.g., Alice Johnson"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => set("status", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium">Email</label>
                <input
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
                  placeholder="alice@vetcare.local"
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium">Phone</label>
                <input
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
                  placeholder="555-2001"
                />
                {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium">Address</label>
              <input
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
                placeholder="Street, City"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                rows={4}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-blue-400"
                placeholder="Account notes…"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t p-4 sm:flex-row sm:justify-end">
            <button type="button" onClick={onReset} className="rounded-xl border px-4 py-2">
              Reset
            </button>
            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-5 py-2 text-white shadow-sm hover:bg-blue-700"
            >
              Save Owner
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
