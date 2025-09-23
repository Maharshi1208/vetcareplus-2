import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createVet } from "../services/vets"; // <-- added

export default function AddVetPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    specialty: "",
    email: "",
    phone: "",
    active: true,
    bio: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);      // <-- added
  const [submitError, setSubmitError] = useState<string| null>(null); // <-- added

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

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      // 🔗 Real API call (admin-only)
      await createVet({
        name: form.name,
        specialty: form.specialty || null,
        email: form.email || null,
        phone: form.phone || null,
        bio: form.bio || null,
        active: form.active,
      });

      // flash + back to list
      navigate("/vets", {
        state: { flash: { type: "success", message: "Vet saved" } },
      });
    } catch (err: any) {
      // keep UI intact, just show a small banner
      console.error(err);
      setSubmitError("Failed to add vet. Please confirm you are logged in as admin.");
    } finally {
      setSubmitting(false);
    }
  }

  function onReset() {
    setForm({
      name: "",
      specialty: "",
      email: "",
      phone: "",
      active: true,
      bio: "",
    });
    setErrors({});
    setSubmitError(null);
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Add Vet</h1>
          <p className="text-sm text-gray-500">Create a new veterinarian profile (UI-only).</p>
        </div>
        <Link to="/vets" className="text-sm underline">← Back to Vets</Link>
      </div>

      {/* Card */}
      <div className="rounded-2xl border bg-white shadow-sm">
        <form onSubmit={onSubmit}>
          <div className="border-b p-4">
            <h2 className="text-base font-medium">Vet Details</h2>
          </div>

          {/* Submit error (keeps design minimal) */}
          {submitError && (
            <div className="mx-4 mt-4 rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-700">
              {submitError}
            </div>
          )}

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
            <button
              type="button"
              onClick={onReset}
              disabled={submitting}
              className="rounded-xl border px-4 py-2 disabled:opacity-50"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-blue-600 px-5 py-2 text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? "Saving…" : "Save Vet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
